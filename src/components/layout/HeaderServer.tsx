// src/components/layout/HeaderServer.tsx
import { cookies } from "next/headers";
import { decodeJwt } from "@/lib/decode-jwt";
import Header from "./Header";

const API_BASE =
  process.env.NESTJS_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://edugenie-api.vercel.app";

export default async function HeaderServer() {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;
  const payload = token ? decodeJwt(token) : null;
  const isStudent = payload?.role === "student";

  // Instant fallback straight from the JWT claims (may be absent on old tokens).
  let displayName =
    payload?.firstName && payload?.lastName
      ? `${payload.firstName} ${payload.lastName}`
      : (payload?.firstName as string | undefined) ?? null;
  let avatarUrl = (payload?.avatar as string | undefined) ?? null;

  // Prefer the authoritative, fresh profile so the name and picture are always
  // correct — including sessions whose token predates these claims, and right
  // after the user updates their avatar.
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const u = json?.data ?? json;
        if (u) {
          displayName =
            u.firstName && u.lastName
              ? `${u.firstName} ${u.lastName}`
              : (u.firstName ?? displayName);
          avatarUrl = u.avatar ?? avatarUrl;
        }
      }
    } catch {
      // Network/profile error — keep the JWT-derived fallback values.
    }
  }

  return (
    <Header isStudent={isStudent} displayName={displayName} avatarUrl={avatarUrl} />
  );
}
