// src/app/api/proxy/orders/checkout/route.ts
// Role-guarded proxy for POST /api/proxy/orders/checkout — students only.

import { NextRequest, NextResponse } from 'next/server';

const BASE_URL =
  process.env.NESTJS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://edugenie-api.vercel.app';
const SERVER_API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

// ─── JWT helpers ──────────────────────────────────────────────────────────────

function getJwtFromRequest(req: NextRequest): string | null {
  const cookieHeader = req.headers.get('cookie') ?? '';
  return (
    cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('jwt='))
      ?.slice('jwt='.length) ?? null
  );
}

function getRoleFromJwt(token: string): string | null {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf-8'),
    );
    return payload.role ?? null;
  } catch {
    return null;
  }
}

function guardStudent(req: NextRequest): NextResponse | null {
  const token = getJwtFromRequest(req);

  if (!token) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const role = getRoleFromJwt(token);

  if (role !== 'student') {
    return NextResponse.json(
      { message: 'Forbidden: students only' },
      { status: 403 },
    );
  }

  return null; // guard passed
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = guardStudent(req);
  if (denied) return denied;

  const token = getJwtFromRequest(req)!; // non-null — guard already checked
  const url = `${SERVER_API_URL}/orders/checkout`;

  let body: string | undefined;
  try {
    body = await req.text();
  } catch {
    // no body
  }

  const backendRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body } : {}),
  });

  const resBody = await backendRes.text();

  const res = new NextResponse(resBody, {
    status: backendRes.status,
    headers: { 'Content-Type': 'application/json' },
  });

  const setCookie = backendRes.headers.get('set-cookie');
  if (setCookie) res.headers.set('set-cookie', setCookie);

  return res;
}
