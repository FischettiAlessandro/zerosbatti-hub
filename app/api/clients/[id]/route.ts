import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';
import { Client } from '@/lib/types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const client = db.prepare('SELECT c.*, u.name as linked_user_name FROM clients c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?').get(id) as Client | undefined;
  if (!client) return NextResponse.json({ error: 'Cliente non trovato' }, { status: 404 });
  const projects = db.prepare('SELECT * FROM projects WHERE client_id = ? ORDER BY created_at DESC').all(id);
  return NextResponse.json({ client, projects });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { name, email, phone, company } = body;
  const db = getDb();
  db.prepare('UPDATE clients SET name=?, email=?, phone=?, company=? WHERE id=?').run(name, email||null, phone||null, company||null, id);
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  return NextResponse.json({ client });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
