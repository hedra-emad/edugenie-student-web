import { NextRequest, NextResponse } from 'next/server';

const NESTJS_URL = process.env.NESTJS_API_URL!;

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return forwardRequest(req, resolvedParams.path, 'GET');
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return forwardRequest(req, resolvedParams.path, 'POST');
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return forwardRequest(req, resolvedParams.path, 'PUT');
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return forwardRequest(req, resolvedParams.path, 'PATCH');
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  return forwardRequest(req, resolvedParams.path, 'DELETE');
}

async function forwardRequest(req: NextRequest, pathSegments: string[], method: string) {
  const path = pathSegments.join('/');
  const search = req.nextUrl.search;
  const url = `${NESTJS_URL}/api/${path}${search}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Forward the jwt cookie from the browser to NestJS
  const cookie = req.headers.get('cookie');
  if (cookie) headers['cookie'] = cookie;

  const init: RequestInit = { method, headers, credentials: 'include' };

  if (method !== 'GET' && method !== 'DELETE') {
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

  // Forward Set-Cookie headers from NestJS back to the browser
  const setCookie = backendRes.headers.get('set-cookie');
  if (setCookie) {
    res.headers.set('set-cookie', setCookie);
  }

  return res;
}