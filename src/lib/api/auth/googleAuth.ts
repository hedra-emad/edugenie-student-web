/**
 * Redirects the browser to the backend's Google OAuth endpoint.
 *
 * MUST be a real full-page navigation (window.location.href) — NOT
 * fetch/axios. OAuth requires the browser to follow a real redirect chain
 * to Google's consent screen and back.
 *
 * This intentionally bypasses /api/proxy (which is fetch-only, used to
 * keep cookies same-domain for XHR calls). The OAuth flow needs to hit the
 * real NestJS backend directly so Google's callback lands on
 * {NEXT_PUBLIC_API_URL}/auth/google/callback, not on a Next.js proxy route.
 *
 * @param role - required for registration (new account role: student or
 *               instructor). Omit for login — backend uses the existing
 *               account's role and ignores any role param for existing
 *               accounts.
 */
export function redirectToGoogleAuth(role?: "student" | "instructor"): void {
  const api = process.env.NEXT_PUBLIC_API_URL;

  if (!api) {
    console.error("NEXT_PUBLIC_API_URL is not set");
    return;
  }

  const url = role
    ? `${api}/api/auth/google?role=${role}`
    : `${api}/api/auth/google`;

  window.location.href = url;
}