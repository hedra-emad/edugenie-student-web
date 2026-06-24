import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });

  // Clear the jwt cookie on the Next.js domain
  res.cookies.set('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 0,   // ← expires immediately
  });

  return res;
}

export async function GET() {
  const NEXTJS_LOGIN = process.env.NEXTJS_APP_URL + '/login';
  const res = NextResponse.redirect(NEXTJS_LOGIN);

  // Clear cookie then redirect to login
  res.cookies.set('jwt', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 0,
  });

  return res;
} 
