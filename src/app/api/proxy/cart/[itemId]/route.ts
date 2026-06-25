// src/app/api/proxy/cart/[itemId]/route.ts
// Role-guarded proxy for DELETE /api/proxy/cart/:itemId — students only.

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

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> },
): Promise<NextResponse> {
  const denied = guardStudent(req);
  if (denied) return denied;

  const { itemId } = await params;
  const token = getJwtFromRequest(req)!; // non-null — guard already checked
  const url = `${SERVER_API_URL}/cart/${encodeURIComponent(itemId)}`;

  const backendRes = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const body = await backendRes.text();

  const res = new NextResponse(body, {
    status: backendRes.status,
    headers: { 'Content-Type': 'application/json' },
  });

  const setCookie = backendRes.headers.get('set-cookie');
  if (setCookie) res.headers.set('set-cookie', setCookie);

  return res;
}
