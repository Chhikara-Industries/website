"use server"

import { fetchMutation, fetchAction } from "convex/nextjs"

import { api } from "@/convex/_generated/api"
import { getAuthToken, convexErrorMessage } from "@/lib/convex-server"

export type FormState =
  | { message?: string; errors?: Record<string, string[]> }
  | undefined

function validatePassword(password: string): string[] {
  const errors: string[] = []
  if (password.length < 8) errors.push("Use at least 8 characters")
  if (!/[a-zA-Z]/.test(password)) errors.push("Include at least one letter")
  if (!/[0-9]/.test(password)) errors.push("Include at least one number")
  return errors
}

export async function updateProfile(
  prev: FormState,
  formData: FormData
): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim()
  if (name.length < 2) {
    return { errors: { name: ["Enter your name"] } }
  }

  try {
    const result = await fetchMutation(
      api.users.updateProfile,
      { name },
      { token: await getAuthToken() }
    )
    return { message: result.message }
  } catch (err) {
    return { errors: {}, message: convexErrorMessage(err) }
  }
}

export async function updatePassword(
  email: string,
  prev: FormState,
  formData: FormData
): Promise<FormState> {
  const current = String(formData.get("current") ?? "")
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  const errors: Record<string, string[]> = {}
  if (!current) errors.current = ["Enter your current password"]
  errors.password = validatePassword(password)
  if (password !== confirm) errors.confirm = ["Passwords do not match"]
  if (Object.keys(errors).length > 0) return { errors }

  try {
    const result = await fetchAction(
      api.security.updatePassword,
      { currentPassword: current, newPassword: password },
      { token: await getAuthToken() }
    )
    return { message: result.message }
  } catch (err) {
    return { errors: {}, message: convexErrorMessage(err) }
  }
}