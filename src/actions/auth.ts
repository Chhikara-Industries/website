"use server"

import { redirect } from "next/navigation"

import { SITE_URL, supabaseConfigured } from "@/lib/env"
import { createClient } from "@/lib/supabase/server"

export type FormState =
  | { message?: string; errors?: Record<string, string[]> }
  | undefined

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function notConfiguredMessage() {
  return {
    errors: {},
    message:
      "Authentication isn't configured yet. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then apply supabase/schema.sql.",
  } satisfies FormState
}

function validatePassword(password: string): string[] {
  const errors: string[] = []
  if (password.length < 8) errors.push("Use at least 8 characters")
  if (!/[a-zA-Z]/.test(password)) errors.push("Include at least one letter")
  if (!/[0-9]/.test(password)) errors.push("Include at least one number")
  return errors
}

export async function login(prev: FormState, formData: FormData) {
  if (!supabaseConfigured()) return notConfiguredMessage()

  const email = String(formData.get("email") ?? "")
  const password = String(formData.get("password") ?? "")

  const errors: Record<string, string[]> = {}
  if (!EMAIL_RE.test(email)) errors.email = ["Enter a valid email address"]
  if (!password) errors.password = ["Password is required"]

  if (Object.keys(errors).length > 0) return { errors }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { errors: {}, message: error.message }
  }

  redirect("/dashboard")
}

export async function signup(prev: FormState, formData: FormData) {
  if (!supabaseConfigured()) return notConfiguredMessage()

  const name = String(formData.get("name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  const errors: Record<string, string[]> = {}
  if (name.length < 2) errors.name = ["Enter your name"]
  if (!EMAIL_RE.test(email)) errors.email = ["Enter a valid email address"]
  errors.password = validatePassword(password)
  if (password !== confirm) errors.confirm = ["Passwords do not match"]

  if (Object.keys(errors).length > 0) return { errors }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${SITE_URL}/verify-email`,
    },
  })

  if (error) {
    return { errors: {}, message: error.message }
  }

  if (data.user) {
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({ id: data.user.id, full_name: name, email })
    if (profileError && profileError.code !== "42P01") {
      // Table may not exist yet (schema not applied); auth still succeeded.
    }
  }

  if (data.session) {
    redirect("/dashboard")
  }

  redirect(`/verify-email?email=${encodeURIComponent(email)}`)
}

export async function forgotPassword(prev: FormState, formData: FormData) {
  if (!supabaseConfigured()) return notConfiguredMessage()

  const email = String(formData.get("email") ?? "").trim()
  if (!EMAIL_RE.test(email)) {
    return { errors: { email: ["Enter a valid email address"] } }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/reset-password`,
  })

  if (error) {
    return { errors: {}, message: error.message }
  }

  return { message: "If that email exists, a reset link is on its way." }
}

export async function resetPassword(prev: FormState, formData: FormData) {
  if (!supabaseConfigured()) return notConfiguredMessage()

  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  const errors: Record<string, string[]> = {}
  errors.password = validatePassword(password)
  if (password !== confirm) errors.confirm = ["Passwords do not match"]
  if (Object.keys(errors).length > 0) return { errors }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { errors: {}, message: error.message }
  }

  await supabase.auth.signOut()
  redirect("/login?reset=success")
}

export async function logout() {
  if (supabaseConfigured()) {
    try {
      const supabase = await createClient()
      await supabase.auth.signOut()
    } catch {
      // Session may already be gone.
    }
  }
  redirect("/login")
}

export async function updateProfile(
  prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim()
  if (name.length < 2) {
    return { errors: { name: ["Enter your name"] } }
  }

  if (!supabaseConfigured()) {
    return { message: "Profile updates are unavailable until Supabase is configured." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { errors: {}, message: "You must be signed in." }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, full_name: name, email: user.email })

  if (error) {
    return { errors: {}, message: error.message }
  }

  return { message: "Profile updated." }
}

export async function updatePassword(
  email: string,
  prev: FormState,
  formData: FormData
) {
  const current = String(formData.get("current") ?? "")
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  const errors: Record<string, string[]> = {}
  if (!current) errors.current = ["Enter your current password"]
  errors.password = validatePassword(password)
  if (password !== confirm) errors.confirm = ["Passwords do not match"]
  if (Object.keys(errors).length > 0) return { errors }

  if (!supabaseConfigured()) {
    return { message: "Password changes are unavailable until Supabase is configured." }
  }

  const supabase = await createClient()
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email,
    password: current,
  })

  if (verifyError) {
    return { errors: {}, message: "Current password is incorrect." }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { errors: {}, message: error.message }
  }

  return { message: "Password updated." }
}