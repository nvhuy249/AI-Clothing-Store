import { NextResponse } from 'next/server';

export async function POST() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = NextResponse.redirect(new URL('/', base));
  res.cookies.set('userEmail', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
    path: '/',
    maxAge: 0,
  });
  return res;
}

