import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');

  let users;
  if (role) {
    users = db.prepare('SELECT id, email, name, role, is_active, created_at FROM users WHERE role = ? ORDER BY name ASC').all(role);
  } else {
    users = db.prepare('SELECT id, email, name, role, is_active, created_at FROM users ORDER BY name ASC').all();
  }

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const body = await request.json();
  const { email, password, name, role } = body;
  if (!email || !password || !name || !role) return NextResponse.json({ error: 'Tutti i campi sono richiesti' }, { status: 400 });

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return NextResponse.json({ error: 'Email già registrata' }, { status: 409 });

  const hash = await bcrypt.hash(password, 10);
  const result = db.prepare('INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)').run(email, hash, name, role);
  const newUser = db.prepare('SELECT id, email, name, role, is_active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json({ user: newUser }, { status: 201 });
}
