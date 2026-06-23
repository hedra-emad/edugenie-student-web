const REMOTE_API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://edugenie-api.vercel.app";
 
const BASE_URL = REMOTE_API_URL;
const AUTH_API_URL = `${BASE_URL}/auth`;

export async function login(credentials: Record<string, any>) {
  const res = await fetch(`${AUTH_API_URL}/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
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
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${AUTH_API_URL}/logout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Logout failed");
  }
  
  return res.json();
}

export async function getProfile() {
  const res = await fetch(`${BASE_URL}/users/profile`, {
    method: "GET",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Not authenticated");
  }

  return res.json();
}

export async function handoffCode() {
  const res = await fetch(`${AUTH_API_URL}/handoff-code`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
  const res = await fetch(`${AUTH_API_URL}/verify-exchange-token`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
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
