import jwt from 'jsonwebtoken';
import { JWTPayload } from './types';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'zerosbatti-super-secret-key-2025-change-in-production';
const COOKIE_NAME = 'zs_token';

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export { COOKIE_NAME };
