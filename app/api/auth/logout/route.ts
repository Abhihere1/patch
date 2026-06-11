import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  const cookieOpts = clearSessionCookie();
  const response = NextResponse.json({ message: 'Logged out.' });
  response.cookies.set(cookieOpts);
  return response;
}
