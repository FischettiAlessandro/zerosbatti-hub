import { verifyToken, COOKIE_NAME } from './jwt';
import { JWTPayload } from './types';
import { cookies } from 'next/headers';

export async function getAuthUser(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}
