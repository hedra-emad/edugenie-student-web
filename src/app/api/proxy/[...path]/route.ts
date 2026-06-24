import { NextRequest, NextResponse } from 'next/server';

const NESTJS_URL = process.env.NESTJS_API_URL!;

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

async function forwardRequest(req: NextRequest, pathSegments: string[], method: string) {
  const path = pathSegments.join('/');
  const search = req.nextUrl.search;
  const url = `${NESTJS_URL}/api/${path}${search}`;



  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;

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

  // Forward ALL Set-Cookie headers from NestJS to the browser
  // getSetCookie() returns an array — handles multiple cookies correctly
  const setCookies = backendRes.headers.getSetCookie?.() ?? [];

  if (setCookies.length > 0) {
    // Set each cookie individually
    setCookies.forEach(cookie => {
      res.headers.append('Set-Cookie', cookie);
    });
  } else {
    // Fallback for environments where getSetCookie() isn't available
    const rawCookie = backendRes.headers.get('set-cookie');
    if (rawCookie) {
      res.headers.set('Set-Cookie', rawCookie);
    }
  }

  return res;
}