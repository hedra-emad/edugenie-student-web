// On the server (SSR), call NestJS directly.
// In the browser, go through /api/proxy so cookies stay same-domain.
import { resolveApiBase } from "@/lib/apiBase";
import { fetchWithTimeout } from "./fetchWithTimeout";

const REMOTE_API =
  process.env.NESTJS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://edugenie-api.vercel.app";
const SERVER_API_URL = resolveApiBase(REMOTE_API);
const BASE_URL = typeof window === 'undefined' ? SERVER_API_URL : '/api/proxy';
const AUTH_API_URL = `${BASE_URL}/auth`;
const USERS_API_URL = `${BASE_URL}/users`;

export async function login(credentials: Record<string, any>) {
  const res = await fetchWithTimeout(`${AUTH_API_URL}/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    timeout: 10000,
    maxRetries: 3,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const errObj = new Error((error as any).message ?? `Request failed: ${res.status}`);
    (errObj as any).status = res.status;
    (errObj as any).error = error;
    throw errObj;
  }

  return res.json();
}

export async function register(payload: Record<string, any>) {
  const res = await fetch(`${AUTH_API_URL}/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const errObj = new Error((error as any).message ?? `Request failed: ${res.status}`);
    (errObj as any).status = res.status;
    (errObj as any).error = error;
    throw errObj;
  }

  return res.json();
}

export async function logout() {
  // Clear the first-party `jwt` cookie via the local route, which deletes it
  // with the SAME attributes it was set with (Path=/, HttpOnly, SameSite=Lax).
  // The cross-domain backend logout uses SameSite=None, which the browser
  // rejects over http in local dev, so the cookie would survive and the user
  // would still appear logged in.
  const res = await fetch('/api/logout', {
    method: 'POST',
    credentials: 'include',
  });

  // Best-effort: also tell the API to clear its own cookie (stateless JWT, so
  // not required for the session to end). Never block logout on it.
  fetch(`${AUTH_API_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  }).catch(() => {});

  if (!res.ok) throw new Error('Logout failed');
  return res.json();
}

export async function getProfile() {
  const res = await fetch(`${USERS_API_URL}/profile`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function handoffCode() {
  const res = await fetchWithTimeout(`${AUTH_API_URL}/handoff-code`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    timeout: 10000,
    maxRetries: 3,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const errObj = new Error((error as any).message ?? `Request failed: ${res.status}`);
    (errObj as any).status = res.status;
    (errObj as any).error = error;
    throw errObj;
  }

  return res.json();
}

export async function redeemCode(payload: { code: string }) {
  const res = await fetch(`${AUTH_API_URL}/redeem-code`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const errObj = new Error((error as any).message ?? `Request failed: ${res.status}`);
    (errObj as any).status = res.status;
    (errObj as any).error = error;
    throw errObj;
  }

  return res.json();
}

export async function verifyExchangeToken(payload: { token: string }) {
  const res = await fetchWithTimeout(`${AUTH_API_URL}/verify-exchange-token`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    timeout: 10000, // Give longer timeout for auth callback flow
    maxRetries: 3,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    const errObj = new Error((error as any).message ?? `Request failed: ${res.status}`);
    (errObj as any).status = res.status;
    (errObj as any).error = error;
    throw errObj;
  }

  return res.json();
}