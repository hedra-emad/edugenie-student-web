'use server';

import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://edugenie-api.vercel.app';

/**
 * Server Action: Generates a handoff code for instructor/admin users.
 * Runs on the server, so it reads the jwt cookie directly — bypassing
 * any browser cookie timing race conditions.
 */
export async function generateHandoffCodeAction(token?: string): Promise<{ code: string; expiresIn: number }> {
  let jwt = token;

  if (!jwt) {
    const cookieStore = await cookies();
    jwt = cookieStore.get('jwt')?.value;
  }

  if (!jwt) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(`${API_URL}/auth/handoff-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `jwt=${jwt}`,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error((error as any).message ?? `Handoff failed: ${res.status}`);
  }

  return res.json();
}
