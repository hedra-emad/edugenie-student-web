import { NextRequest, NextResponse } from 'next/server';
import { resolveApiBase } from '@/lib/apiBase';

const BASE_URL =
  process.env.NESTJS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://edugenie-api.vercel.app';
const SERVER_API_URL = resolveApiBase(BASE_URL);

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

// Returns true if a state-changing request's Origin is NOT the app itself.
function isCrossSiteMutation(req: NextRequest, method: string): boolean {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false;
  const origin = req.headers.get('origin');
  // Same-origin browser requests send an Origin equal to the app's own origin.
  // Server-to-server / curl requests have no Origin and are allowed.
  if (!origin) return false;
  return origin !== req.nextUrl.origin;
}

async function forwardRequest(
  req: NextRequest,
  pathSegments: string[],
  method: string,
): Promise<NextResponse> {
  // CSRF defense: reject cross-site mutations. The browser only ever calls this
  // proxy same-origin, so a foreign Origin on a POST/PUT/PATCH/DELETE is forged.
  if (isCrossSiteMutation(req, method)) {
    return NextResponse.json({ message: 'Cross-site request blocked' }, { status: 403 });
  }

  const path = pathSegments.join('/');
  const search = req.nextUrl.search;
  const url = `${SERVER_API_URL}/${path}${search}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

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

  const res = new NextResponse(body, {
    status: backendRes.status,
    // Pass through the backend's real content type so non-JSON errors
    // (e.g. an HTML gateway 502) aren't mislabeled as JSON.
    headers: {
      'Content-Type':
        backendRes.headers.get('content-type') ?? 'application/json',
    },
  });

  const setCookie = backendRes.headers.get('set-cookie');
  if (setCookie) {
    const jwtMatch = setCookie.match(/jwt=([^;]+)/);
    if (jwtMatch) {
      const isProd = process.env.NODE_ENV === 'production';
      // The proxy is same-origin, so SameSite=Lax is sufficient and avoids the
      // cross-site exposure of SameSite=None. Secure only in production (HTTPS).
      const cookie = [
        `jwt=${jwtMatch[1]}`,
        'Path=/',
        'HttpOnly',
        isProd ? 'Secure' : '',
        'SameSite=Lax',
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