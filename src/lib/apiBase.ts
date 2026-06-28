/**
 * Resolves the backend API base URL.
 *
 * The NestJS backend serves EVERY route under `/api` because `main.ts` calls
 * `app.setGlobalPrefix('api')` unconditionally — locally and in production
 * alike (e.g. `http://localhost:5000/api/auth/login`). So we always ensure the
 * base ends with `/api`, whether the host is localhost or the deployed API.
 *
 * The base may already include `/api` (some env vars set it that way), so we
 * append it only when it isn't already there to avoid a double `/api/api`.
 */
export function resolveApiBase(raw: string): string {
  const base = (raw || '').replace(/\/+$/, '');
  return base.endsWith('/api') ? base : `${base}/api`;
}
