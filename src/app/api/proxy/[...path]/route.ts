import { NextRequest, NextResponse } from 'next/server';

const BASE_URL =
  process.env.NESTJS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://edugenie-api.vercel.app';
const SERVER_API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(req, (await params).path, 'GET');
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(req, (await params).path, 'POST');
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(req, (await params).path, 'PUT');
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(req, (await params).path, 'PATCH');
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forwardRequest(req, (await params).path, 'DELETE');
}

async function forwardRequest(
  req: NextRequest,
  pathSegments: string[],
  method: string,
): Promise<NextResponse> {
  const path = pathSegments.join('/');
  const search = req.nextUrl.search;
  const url = `${NESTJS_URL}/api/${path}${search}`;



  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Extract jwt cookie and forward as Bearer token
  // (server-to-server fetch has no cookie jar, so we build the header manually)
  const cookieHeader = req.headers.get('cookie') ?? '';
  const jwtToken =
    cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('jwt='))
      ?.slice('jwt='.length) ?? null;

  if (jwtToken) headers['Authorization'] = `Bearer ${jwtToken}`;

  const init: RequestInit = { method, headers };

  if (method !== 'GET' && method !== 'DELETE') {
    try {
      init.body = await req.text();
    } catch { /* no body */ }
  }

  const backendRes = await fetch(url, init);
  const body = await backendRes.text();

  // Build response
  const res = new NextResponse(body, {
    status: backendRes.status,
    headers: { 'Content-Type': 'application/json' },
  });

  // Rewrite Set-Cookie from NestJS so it lands on the correct domain (localhost in dev)
  const setCookie = backendRes.headers.get('set-cookie');
  if (setCookie) {
    const jwtMatch = setCookie.match(/jwt=([^;]+)/);
    if (jwtMatch) {
      const isProd = process.env.NODE_ENV === 'production';
      const cookie = [
        `jwt=${jwtMatch[1]}`,
        'Path=/',
        'HttpOnly',
        isProd ? 'Secure' : '',
        isProd ? 'SameSite=None' : 'SameSite=Lax',
        'Max-Age=86400',
      ]
        .filter(Boolean)
        .join('; ');

      res.headers.set('set-cookie', cookie);
    } else {
      res.headers.set('set-cookie', setCookie);
    }
  }

  return res;
}