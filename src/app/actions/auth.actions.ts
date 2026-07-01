'use server';

import { cookies } from 'next/headers';
import { resolveApiBase } from '@/lib/apiBase';
import { fetchWithTimeout } from '@/lib/api/fetchWithTimeout';

const REMOTE_API =
  process.env.NESTJS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://edugenie-api.vercel.app";
const API_URL = resolveApiBase(REMOTE_API);

/**
 * Server Action: Generates a handoff code for instructor/admin users.
 * Runs on the server, so it reads the jwt cookie directly — bypassing
 * any browser cookie timing race conditions.
 */
export async function generateHandoffCodeAction(): Promise<{ code: string; expiresIn: number }> {
  const cookieStore = await cookies();
  const jwt = cookieStore.get('jwt')?.value;

  if (!jwt) {
    throw new Error('Not authenticated');
  }

  const res = await fetchWithTimeout(`${API_URL}/auth/handoff-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `jwt=${jwt}`,
    },
    timeout: 10000,
    maxRetries: 3,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error((error as any).message ?? `Handoff failed: ${res.status}`);
  }

  return res.json();
}
