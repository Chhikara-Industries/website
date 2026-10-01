/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as apiKeys from "../apiKeys.js";
import type * as auth from "../auth.js";
import type * as checkouts from "../checkouts.js";
import type * as credits from "../credits.js";
import type * as http from "../http.js";
import type * as lib_helpers from "../lib/helpers.js";
import type * as security from "../security.js";
import type * as slicky from "../slicky.js";
import type * as slickyDb from "../slickyDb.js";
import type * as slickyQueries from "../slickyQueries.js";
import type * as subscriptions from "../subscriptions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  apiKeys: typeof apiKeys;
  auth: typeof auth;
  checkouts: typeof checkouts;
  credits: typeof credits;
  http: typeof http;
  "lib/helpers": typeof lib_helpers;
  security: typeof security;
  slicky: typeof slicky;
  slickyDb: typeof slickyDb;
  slickyQueries: typeof slickyQueries;
  subscriptions: typeof subscriptions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
