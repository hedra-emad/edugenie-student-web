import type { ProfileResponse, ProfileUpdatePayload } from "@/types/profile.types";

const BASE = "https://edugenie-api.vercel.app";

function getBaseUrl(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? BASE;
  }
  return process.env.NEXT_PUBLIC_API_BASE ?? "/api/proxy";
}

export async function fetchProfile(token: string): Promise<ProfileResponse> {
  const res = await fetch(`${BASE}/api/users/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("FETCH_PROFILE_FAILED");
  return res.json();
}

export async function updateProfile(
  token: string,
  payload: ProfileUpdatePayload
): Promise<ProfileResponse> {
  const res = await fetch(`${BASE}/api/users/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("UPDATE_PROFILE_FAILED");
  return res.json();
}

export async function uploadAvatar(
  token: string,
  file: File
): Promise<ProfileResponse> {
  const form = new FormData();
  form.append("avatar", file);

  const res = await fetch(`${BASE}/api/users/avatar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error("UPLOAD_AVATAR_FAILED");
  return res.json();
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function changePassword(
  payload: ChangePasswordPayload
): Promise<void> {
  const res = await fetch(`${getBaseUrl()}/users/change-password`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ?? "Failed to change password"
    );
  }
}
