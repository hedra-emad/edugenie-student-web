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

/**
 * Upload / replace the profile picture. The backend endpoint is the shared
 * `PATCH /api/users/profile` with a multipart `profileImage` field — it uploads
 * to Cloudinary (folder `avatars`), destroys any previous image, and returns the
 * updated profile with the new `avatar` URL. Do NOT set Content-Type manually:
 * the browser must add the multipart boundary itself.
 */
export async function uploadAvatar(
  token: string,
  file: File
): Promise<ProfileResponse> {
  const form = new FormData();
  form.append("profileImage", file);

  const res = await fetch(`${BASE}/api/users/profile`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) throw new Error("UPLOAD_AVATAR_FAILED");
  return res.json();
}

/**
 * Remove the profile picture. Sends `{ avatar: null }` to the same endpoint;
 * the backend destroys the Cloudinary image and clears `avatar`/`avatarPublicId`.
 */
export async function deleteAvatar(token: string): Promise<ProfileResponse> {
  const res = await fetch(`${BASE}/api/users/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ avatar: null }),
  });
  if (!res.ok) throw new Error("DELETE_AVATAR_FAILED");
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
