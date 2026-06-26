import { NextResponse } from 'next/server';

const NEXTJS_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://edugenie-student-web.vercel.app';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.headers.set('Set-Cookie', buildClearCookieHeader());
  return res;
}

export async function GET() {
  const res = NextResponse.redirect(`${NEXTJS_URL}/`);
  res.headers.set('Set-Cookie', buildClearCookieHeader());
  return res;
}

function buildClearCookieHeader(): string {
  return [
    'jwt=',
    'Path=/',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'Max-Age=0',
    'HttpOnly',
    'Secure',
    'SameSite=None',
  ].join('; ');
}