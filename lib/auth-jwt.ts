import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from './types';

export const AUTH_COOKIE_NAME = 'codeexam_token';

export interface AuthTokenPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

function getSecretKey(overrideSecret?: string): Uint8Array {
  const secret =
    overrideSecret ||
    process.env.JWT_SECRET ||
    'codeexam-dev-fallback-secret-change-in-production-32chars';
  return new TextEncoder().encode(secret);
}

export async function signAuthToken(
  payload: AuthTokenPayload,
  overrideSecret?: string
): Promise<string> {
  return new SignJWT({
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey(overrideSecret));
}

export async function verifyAuthToken(
  token: string,
  overrideSecret?: string
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(overrideSecret), {
      algorithms: ['HS256'],
    });
    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.name !== 'string' ||
      (payload.role !== 'admin' && payload.role !== 'user')
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
