"use node";

import { v, ConvexError } from "convex/values";
import { action, ActionCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";
import { hashApiKey } from "./apiKeys";

type SlickyContentType = "text" | "image" | "gif" | "audio" | "video";

type SlickyMessageOut = {
  id: Id<"slickyMessages">;
  content: string | null;
  contentType: string;
  createdAt: number;
  user: {
    id: Id<"users">;
    name: string | null;
    email: string | null;
    avatarUrl: string | null;
  };
  attachment: {
    url: string | null;
    mime: string | null;
    name: string | null;
  } | null;
};

const API_KEY_RE = /^ci_live_[a-f0-9]{12}_[a-f0-9]{48}$/i;

const CONTENT_COST: Record<SlickyContentType, number> = {
  text: 1,
  image: 2,
  gif: 3,
  audio: 4,
  video: 5,
};

const MIME_PATTERNS: Record<SlickyContentType, RegExp> = {
  image: /^image\/(jpeg|png|webp|gif)$/,
  gif: /^image\/gif$/,
  audio: /^audio\/(mpeg|ogg|wav|mp4|aac|flac)$/,
  video: /^video\/(mp4|webm|ogg|quicktime)$/,
  text: /^text\/plain$/,
};

const EXT_MAP: Record<SlickyContentType, string[]> = {
  image: ["jpg", "jpeg", "png", "webp", "gif"],
  gif: ["gif"],
  audio: ["mp3", "ogg", "wav", "m4a", "aac", "flac"],
  video: ["mp4", "webm", "ogv", "mov"],
  text: ["txt"],
};

const SIZE_LIMITS: Record<SlickyContentType, number> = {
  image: 10 * 1024 * 1024,
  gif: 10 * 1024 * 1024,
  audio: 15 * 1024 * 1024,
  video: 40 * 1024 * 1024,
  text: 1024 * 1024,
};

function slickyError(status: number, code: string, message: string) {
  return new ConvexError({ status, code, message });
}

type SlickyUser = {
  id: Id<"users">;
  name: string | null;
  email: string | undefined;
  avatarUrl: string | null;
  keyPrefix: string;
};

async function resolveKey(ctx: ActionCtx, apiKey: string): Promise<SlickyUser> {
  if (!API_KEY_RE.test(apiKey)) {
    throw slickyError(401, "invalid_api_key", "Invalid API key format.");
  }
  const secretHash = await hashApiKey(apiKey);
  const key = await ctx.runQuery(internal.slickyQueries.getKeyByHash, {
    secretHash,
  });
  if (!key || key.revokedAt !== undefined) {
    throw slickyError(401, "invalid_api_key", "Unknown or revoked API key.");
  }
  await ctx.runMutation(internal.slickyDb.touchKey, { id: key._id });
  const user = await ctx.runQuery(internal.slickyQueries.getUser, {
    id: key.userId,
  });
  if (!user) {
    throw slickyError(401, "invalid_api_key", "Linked user not found.");
  }
  return {
    id: user._id,
    name: user.name ?? null,
    email: user.email ?? undefined,
    avatarUrl: user.image ?? null,
    keyPrefix: key.prefix,
  };
}

async function balanceOf(ctx: ActionCtx, userId: Id<"users">): Promise<number> {
  const row = await ctx.runQuery(internal.slickyQueries.getCredits, { userId });
  return row?.balance ?? 0;
}

export const resolveKeyAction = action({
  args: { apiKey: v.string() },
  handler: async (ctx, args) => {
    const key = await resolveKey(ctx, args.apiKey);
    const balance = await balanceOf(ctx, key.id);
    return {
      user: {
        id: key.id,
        name: key.name,
        email: key.email,
        avatarUrl: key.avatarUrl,
        keyPrefix: key.keyPrefix,
      },
      balance,
    };
  },
});

export const createRoom = action({
  args: { apiKey: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const { id: userId } = await resolveKey(ctx, args.apiKey);
    const roomName = args.name.trim();
    if (!roomName) {
      throw slickyError(400, "invalid_name", "Room name is required.");
    }
    const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let attempt = 0; attempt < 20; attempt++) {
      let candidate = "";
      for (let i = 0; i < 6; i++) {
        candidate += ROOM_CODE_ALPHABET[
          Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)
        ];
      }
      const res = await ctx.runMutation(internal.slickyDb.createRoomDb, {
        code: candidate,
        name: roomName,
        userId,
      });
      if (res.ok) {
        code = candidate;
        break;
      }
    }
    if (!code) {
      throw slickyError(500, "room_creation_failed", "Could not allocate a room code.");
    }
    return { room: { code, name: roomName, createdBy: userId } };
  },
});

export const joinRoom = action({
  args: { apiKey: v.string(), code: v.string() },
  handler: async (
    ctx,
    args,
  ): Promise<{ room: { code: string; name: string } }> => {
    const { id: userId } = await resolveKey(ctx, args.apiKey);
    const code = args.code.toUpperCase();
    if (!/^[A-Z0-9]{4,12}$/.test(code)) {
      throw slickyError(400, "invalid_code", "Invalid room code.");
    }
    const room: Doc<"slickyRooms"> | null = await ctx.runQuery(
      internal.slickyQueries.getRoomByCode,
      { code },
    );
    if (!room) {
      throw slickyError(404, "room_not_found", "Room not found.");
    }
    await ctx.runMutation(internal.slickyDb.joinRoomDb, { code, userId });
    return { room: { code: room.code, name: room.name } };
  },
});

export const listRooms = action({
  args: { apiKey: v.string() },
  handler: async (ctx, args) => {
    const { id: userId } = await resolveKey(ctx, args.apiKey);
    const memberships = await ctx.runQuery(
      internal.slickyQueries.getMembershipsByUser,
      { userId },
    );
    const rooms: { code: string; name: string }[] = [];
    for (const m of memberships) {
      const room = await ctx.runQuery(internal.slickyQueries.getRoomByCode, {
        code: m.roomCode,
      });
      if (room) {
        rooms.push({ code: room.code, name: room.name });
      }
    }
    return { rooms };
  },
});

export const readMessages = action({
  args: { apiKey: v.string(), code: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { id: userId } = await resolveKey(ctx, args.apiKey);
    const code = args.code.toUpperCase();
    const room: Doc<"slickyRooms"> | null = await ctx.runQuery(
      internal.slickyQueries.getRoomByCode,
      { code },
    );
    if (!room) {
      throw slickyError(404, "room_not_found", "Room not found.");
    }
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);
    const messages: Doc<"slickyMessages">[] = await ctx.runQuery(
      internal.slickyQueries.getMessagesByRoom,
      {
        roomCode: code,
        limit,
      },
    );

    const out: SlickyMessageOut[] = [];
    for (const m of messages) {
      let attachment: SlickyMessageOut["attachment"] = null;
      if (m.attachmentId !== undefined) {
        const url: string | null = await ctx.storage.getUrl(m.attachmentId);
        attachment = {
          url,
          mime: m.attachmentMime ?? null,
          name: m.attachmentName ?? null,
        };
      }
      const author: Doc<"users"> | null = await ctx.runQuery(
        internal.slickyQueries.getUser,
        {
          id: m.userId,
        },
      );
      out.push({
        id: m._id,
        content: m.content ?? null,
        contentType: m.contentType,
        createdAt: m.createdAt,
        user: {
          id: m.userId,
          name: author?.name ?? null,
          email: author?.email ?? null,
          avatarUrl: author?.image ?? null,
        },
        attachment,
      });
    }
    out.reverse();
    const balance = await balanceOf(ctx, userId);
    return { messages: out, balance };
  },
});

export const sendMessage = action({
  args: {
    apiKey: v.string(),
    code: v.string(),
    contentType: v.string(),
    content: v.optional(v.string()),
    attachment: v.optional(
      v.object({
        dataUrl: v.string(),
        mimeType: v.string(),
        filename: v.string(),
      }),
    ),
  },
  handler: async (
    ctx,
    args,
  ): Promise<{ message: SlickyMessageOut; balance: number; cost: number }> => {
    const { id: userId } = await resolveKey(ctx, args.apiKey);
    const code = args.code.toUpperCase();
    const room: Doc<"slickyRooms"> | null = await ctx.runQuery(
      internal.slickyQueries.getRoomByCode,
      { code },
    );
    if (!room) {
      throw slickyError(404, "room_not_found", "Room not found.");
    }
    const contentType = args.contentType as SlickyContentType;
    if (!(contentType in CONTENT_COST)) {
      throw slickyError(400, "invalid_content_type", "Unsupported content type.");
    }
    const cost = CONTENT_COST[contentType];

    let attachmentId: Id<"_storage"> | undefined;
    let attachmentMime: string | undefined;
    let attachmentName: string | undefined;

    if (args.attachment) {
      const { dataUrl, mimeType, filename } = args.attachment;
      const pattern = MIME_PATTERNS[contentType];
      if (!pattern || !pattern.test(mimeType)) {
        throw slickyError(400, "invalid_mime", "File type not allowed for this content type.");
      }
      const mimeExts = EXT_MAP[contentType];
      const base = filename.split(".").pop();
      const hasAllowedExt = base
        ? mimeExts.some((ext) => base.toLowerCase() === ext)
        : false;
      const ext = hasAllowedExt && base ? base : mimeExts[0];
      const matches = dataUrl.match(/^data:([^;]+);base64,([\s\S]*)$/);
      if (!matches) {
        throw slickyError(400, "invalid_data_url", "Expected a base64 data URL.");
      }
      const buf = Buffer.from(matches[2], "base64");
      const limit = SIZE_LIMITS[contentType];
      if (buf.byteLength > limit) {
        throw slickyError(413, "file_too_large", "File exceeds the size limit.");
      }
      attachmentId = await ctx.storage.store(new Blob([buf], { type: mimeType }));
      attachmentMime = mimeType;
      attachmentName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    }

    const messageId: Id<"slickyMessages"> = await ctx.runMutation(
      internal.slickyDb.insertMessage,
      {
        roomCode: code,
        userId,
        contentType,
        content: args.content,
        attachmentId,
        attachmentMime,
        attachmentName,
        cost,
      },
    );

    const spend: { ok: boolean; balance: number } = await ctx.runMutation(
      api.credits.spendTokens,
      {
        userId,
        amount: cost,
      },
    );
    if (!spend.ok) {
      if (attachmentId) {
        await ctx.storage.delete(attachmentId);
      }
      await ctx.runMutation(internal.slickyDb.deleteMessage, { messageId });
      throw slickyError(402, "insufficient_tokens", "Insufficient token balance.");
    }

    await ctx.runMutation(internal.slickyDb.logUsage, { userId, cost });

    const author: Doc<"users"> | null = await ctx.runQuery(
      internal.slickyQueries.getUser,
      {
        id: userId,
      },
    );
    return {
      message: {
        id: messageId,
        content: args.content ?? null,
        contentType,
        createdAt: Date.now(),
        user: {
          id: userId,
          name: author?.name ?? null,
          email: author?.email ?? null,
          avatarUrl: author?.image ?? null,
        },
        attachment: attachmentId
          ? {
              url: await ctx.storage.getUrl(attachmentId),
              mime: attachmentMime ?? null,
              name: attachmentName ?? null,
            }
          : null,
      },
      balance: spend.balance,
      cost,
    };
  },
});