import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { name, email, role, is_active, password } = body;
  const db = getDb();

  if (password) {
    const hash = await bcrypt.hash(password, 10);
    db.prepare('UPDATE users SET name=?, email=?, role=?, is_active=?, password_hash=?, updated_at=datetime("now") WHERE id=?')
      .run(name, email, role, is_active ? 1 : 0, hash, id);
  } else {
    db.prepare('UPDATE users SET name=?, email=?, role=?, is_active=?, updated_at=datetime("now") WHERE id=?')
      .run(name, email, role, is_active ? 1 : 0, id);
  }

  const updatedUser = db.prepare('SELECT id, email, name, role, is_active, created_at FROM users WHERE id = ?').get(id);
  return NextResponse.json({ user: updatedUser });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
