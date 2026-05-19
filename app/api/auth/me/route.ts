import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const db = getDb();
  const dbUser = db.prepare('SELECT id, email, name, role, is_active, created_at FROM users WHERE id = ?').get(user.userId) as any;
  if (!dbUser) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });

  const permissions = db.prepare('SELECT module_name, is_visible FROM module_permissions WHERE user_id = ?').all(user.userId) as any[];
  const permMap: Record<string, boolean> = {};
  permissions.forEach(p => { permMap[p.module_name] = p.is_visible === 1; });

  return NextResponse.json({ user: dbUser, permissions: permMap });
}
