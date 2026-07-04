import { NextRequest, NextResponse } from 'next/server';
import { resolveApiBase } from '@/lib/apiBase';

const BASE_URL =
  process.env.NESTJS_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'https://edugenie-api.vercel.app';
const SERVER_API_URL = resolveApiBase(BASE_URL);

// The proxy refreshes the session INLINE: on a 401 for any API call it spends
// the refresh cookie and retries. For that the browser must send the refresh
// cookie on every proxy request, so it is scoped to the whole proxy (`/api/proxy`)
// — NOT just `/api/proxy/auth` (which would omit it from normal calls like
// `/api/proxy/enrollments`, silently defeating the refresh and logging users out).
// It stays HttpOnly + SameSite=Lax and is only ever forwarded to the backend for
// the auth/refresh + auth/logout routes (see buildHeaders), so the wider path
// adds no exposure.
const REFRESH_COOKIE_BROWSER_PATH = '/api/proxy';

// Auth endpoints whose own 401 must NOT trigger a silent refresh+retry
// (failed login is failed login; refresh recursion would loop).
const NO_REFRESH_PATHS = new Set([
  'auth/login',
  'auth/register',
  'auth/refresh',
  'auth/logout',
]);

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

function readCookie(cookieHeader: string, name: string): string | null {
  return (
    cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
}

/**
 * Re-mints a backend Set-Cookie for the browser: the proxy is same-origin, so
 * SameSite=Lax is sufficient (vs the backend's cross-site SameSite=None), and
 * the refresh cookie gets the proxy-local path. Max-Age is carried over from
 * the backend so cookie and token lifetimes stay in sync (including Max-Age=0
 * deletions on logout / dead-session refreshes).
 */
function remintCookie(backendCookie: string): string | null {
  const [pair, ...attrs] = backendCookie.split(';').map((s) => s.trim());
  const eq = pair.indexOf('=');
  if (eq < 0) return null;
  const name = pair.slice(0, eq);
  const value = pair.slice(eq + 1);
  if (name !== 'jwt' && name !== 'refreshToken') return backendCookie;

  const maxAge = attrs
    .find((a) => a.toLowerCase().startsWith('max-age='))
    ?.slice('max-age='.length);
  const expires = attrs
    .find((a) => a.toLowerCase().startsWith('expires='))
    ?.slice('expires='.length);

  const isProd = process.env.NODE_ENV === 'production';
  return [
    `${name}=${value}`,
    `Path=${name === 'refreshToken' ? REFRESH_COOKIE_BROWSER_PATH : '/'}`,
    'HttpOnly',
    isProd ? 'Secure' : '',
    'SameSite=Lax',
    maxAge !== undefined ? `Max-Age=${maxAge}` : '',
    // clearCookie() signals deletion via Expires instead of Max-Age.
    maxAge === undefined && expires ? `Expires=${expires}` : '',
  ]
    .filter(Boolean)
    .join('; ');
}

function collectCookies(res: Response): string[] {
  return res.headers
    .getSetCookie()
    .map(remintCookie)
    .filter((c): c is string => c !== null);
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

  const cookieHeader = req.headers.get('cookie') ?? '';
  let jwtToken = readCookie(cookieHeader, 'jwt');
  const refreshToken = readCookie(cookieHeader, 'refreshToken');

  const buildHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (jwtToken) headers['Authorization'] = `Bearer ${jwtToken}`;
    // The backend refresh endpoint reads the httpOnly cookie via cookie-parser.
    if (path === 'auth/refresh' && refreshToken) {
      headers['cookie'] = `refreshToken=${refreshToken}`;
    }
    // logout revokes the refresh session server-side — pass the cookie along.
    if (path === 'auth/logout' && refreshToken) {
      headers['cookie'] = `refreshToken=${refreshToken}`;
    }
    return headers;
  };

  const init: RequestInit = { method, headers: buildHeaders() };

  if (method !== 'GET' && method !== 'DELETE') {
    try {
      init.body = await req.text();
    } catch { /* no body */ }
  }

  let backendRes = await fetch(url, init);

  // Cookies to forward to the browser (refresh rotation happens mid-flight,
  // before the final response is built).
  const pendingCookies: string[] = [];

  // ── Silent session refresh ────────────────────────────────────────────────
  // Access JWTs are short-lived (15 min). On a 401 for a normal API call, spend
  // the refresh cookie server-side, then retry the original request ONCE.
  if (
    backendRes.status === 401 &&
    refreshToken &&
    !NO_REFRESH_PATHS.has(path)
  ) {
    const refreshRes = await fetch(`${SERVER_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: `refreshToken=${refreshToken}`,
      },
    });

    // Forward the rotated (or, on failure, cleared) cookies either way.
    pendingCookies.push(...collectCookies(refreshRes));

    if (refreshRes.ok) {
      const newJwt = refreshRes.headers
        .getSetCookie()
        .map((c) => c.match(/^jwt=([^;]+)/)?.[1])
        .find(Boolean);
      if (newJwt) {
        jwtToken = newJwt;
        // init.body is a string (already read), so the retry is safe.
        backendRes = await fetch(url, { ...init, headers: buildHeaders() });
      }
    }
  }

  // Server-Sent Events (AI tutor): pipe the stream straight through instead of
  // buffering with .text(), so tokens reach the browser word-by-word.
  const contentType = backendRes.headers.get('content-type') ?? '';
  if (contentType.includes('text/event-stream') && backendRes.body) {
    const sseRes = new NextResponse(backendRes.body, {
      status: backendRes.status,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
    for (const cookie of pendingCookies) {
      sseRes.headers.append('set-cookie', cookie);
    }
    return sseRes;
  }

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

  // Mid-flight refresh cookies first, then the final response's own cookies
  // (same-name cookies later in the header list win in the browser).
  for (const cookie of [...pendingCookies, ...collectCookies(backendRes)]) {
    res.headers.append('set-cookie', cookie);
  }

  return res;
}
