"use server";

import { cookies } from "next/headers";
import { updateProfile } from "@/lib/api/profile.api";
import type { ProfileUpdatePayload } from "@/types/profile.types";

export async function updateProfileAction(
  payload: ProfileUpdatePayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const store = await cookies();
    const token = store.get("jwt")?.value ?? "";
    await updateProfile(token, payload);
    return { success: true };
  } catch {
    return { success: false, error: "Could not save changes. Try again." };
  }
}