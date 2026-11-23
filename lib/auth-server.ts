import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  AUTH_COOKIE_NAME,
  AuthTokenPayload,
  signAuthToken,
  verifyAuthToken,
} from './auth-jwt';
import type { SafeUser, User } from './types';

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getTokenFromRequest(
  req?: NextRequest
): Promise<string | null> {
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      return authHeader.slice(7).trim();
    }
    const cookieVal = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (cookieVal) return cookieVal;
  }
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value ?? null;
}

export async function getSessionUser(
  req?: NextRequest
): Promise<AuthTokenPayload | null> {
  const token = await getTokenFromRequest(req);
  if (!token) return null;
  return verifyAuthToken(token);
}

export async function attachAuthCookie(
  res: NextResponse,
  user: SafeUser
): Promise<string> {
  const token = await signAuthToken({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  res.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return token;
}

export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
