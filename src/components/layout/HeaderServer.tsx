// src/components/layout/HeaderServer.tsx
import { cookies } from "next/headers";
import { decodeJwt } from "@/lib/decode-jwt";
import Header from "./Header";

const API_BASE =
  process.env.NESTJS_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://edugenie-api.vercel.app";

/**
 * Fetch user profile with timeout and retry logic.
 * Handles backend cold starts and transient connection errors gracefully.
 */
async function fetchUserProfileWithRetry(token: string, maxRetries: number = 3) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Create abort controller for 5-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${API_BASE}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        return json?.data ?? json;
      }

      // Non-2xx response - don't retry, return null to use JWT fallback
      return null;
    } catch (error) {
      lastError = error as Error;
      const isLastAttempt = attempt === maxRetries - 1;

      // Determine if we should retry
      const shouldRetry =
        !isLastAttempt &&
        (error instanceof Error &&
          (error.name === "AbortError" || // timeout
            error.message.includes("ECONNRESET") || // connection reset
            error.message.includes("ECONNREFUSED") || // connection refused (cold start)
            error.message.includes("ERR_FAILED"))); // generic network failure

      if (!shouldRetry) {
        // Not a transient error or last attempt - return null to use JWT fallback
        return null;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // All retries exhausted - log and return null to use JWT fallback
  console.warn(
    `Failed to fetch user profile after ${maxRetries} attempts:`,
    lastError?.message || "Unknown error"
  );
  return null;
}

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
      const profile = await fetchUserProfileWithRetry(token);
      if (profile) {
        const u = profile;
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
      // This should be rare since fetchUserProfileWithRetry handles errors internally.
    }
  }

  return (
    <Header isStudent={isStudent} displayName={displayName} avatarUrl={avatarUrl} />
  );
}
