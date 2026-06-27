/**
 * Resolves the backend API base URL.
 *
 * The deployed NestJS API is reached under `/api/*` because Vercel's rewrite
 * maps `/api/(.*)` onto the app (and strips the prefix). A local dev backend,
 * however, serves routes WITHOUT that prefix (e.g. `http://localhost:5000/auth/login`).
 *
 * So we append `/api` for remote hosts but never for localhost. This keeps
 * production working with the existing env vars while fixing local dev.
 */
export function resolveApiBase(raw: string): string {
  const base = (raw || '').replace(/\/+$/, '');
  if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/i.test(base)) {
    return base;
  }
  return base.endsWith('/api') ? base : `${base}/api`;
}
