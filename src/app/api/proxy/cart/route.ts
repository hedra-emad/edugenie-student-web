// src/app/api/proxy/cart/route.ts
// Role-guarded proxy for /api/proxy/cart — students only.
// Takes precedence over the catch-all [...path] route.

import { NextRequest, NextResponse } from 'next/server';
import { resolveApiBase } from '@/lib/apiBase';

const BASE_URL =
  process.env.NESTJS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://edugenie-api.vercel.app';
const SERVER_API_URL = resolveApiBase(BASE_URL);

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

// ─── Proxy helpers ────────────────────────────────────────────────────────────

async function forwardToCart(req: NextRequest, method: string): Promise<NextResponse> {
  const token = getJwtFromRequest(req)!; // guaranteed non-null — guard already checked
  const search = req.nextUrl.search;
  const url = `${SERVER_API_URL}/cart${search}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const init: RequestInit = { method, headers };

  if (method !== 'GET') {
    try {
      init.body = await req.text();
    } catch {
      // no body
    }
  }

  const backendRes = await fetch(url, init);
  const body = await backendRes.text();

  const res = new NextResponse(body, {
    status: backendRes.status,
    headers: { 'Content-Type': 'application/json' },
  });

  const setCookie = backendRes.headers.get('set-cookie');
  if (setCookie) res.headers.set('set-cookie', setCookie);

  return res;
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = guardStudent(req);
  if (denied) return denied;
  return forwardToCart(req, 'GET');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = guardStudent(req);
  if (denied) return denied;
  return forwardToCart(req, 'POST');
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const denied = guardStudent(req);
  if (denied) return denied;
  return forwardToCart(req, 'DELETE');
}
