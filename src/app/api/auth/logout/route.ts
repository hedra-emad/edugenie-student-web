import { NextResponse } from 'next/server';

const NEXTJS_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://edugenie-student-web.vercel.app';

export async function POST() {
  const res = NextResponse.json({ success: true });

  res.cookies.set('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 0,
  });

  return res;
}

export async function GET() {
  const res = NextResponse.redirect(`${NEXTJS_URL}`);

  res.cookies.set('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 0,
  });

  return res;
}