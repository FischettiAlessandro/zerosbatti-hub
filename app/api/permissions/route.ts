import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';
import { User, ModulePermission } from '@/lib/types';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('user_id');

  if (userId) {
    const permissions = db.prepare('SELECT * FROM module_permissions WHERE user_id = ?').all(userId);
    return NextResponse.json({ permissions });
  }

  const users = db.prepare("SELECT id, name, email, role FROM users WHERE role != 'admin'").all() as User[];
  const allPermissions = db.prepare('SELECT * FROM module_permissions').all() as ModulePermission[];

  const result = users.map(u => ({
    ...u,
    permissions: allPermissions.filter(p => p.user_id === u.id),
  }));

  return NextResponse.json({ users: result });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const body = await request.json();
  const { user_id, module_name, is_visible } = body;

  const db = getDb();
  db.prepare(`
    INSERT INTO module_permissions (user_id, module_name, is_visible)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, module_name) DO UPDATE SET is_visible = excluded.is_visible
  `).run(user_id, module_name, is_visible ? 1 : 0);

  return NextResponse.json({ success: true });
}
