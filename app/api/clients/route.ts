import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const db = getDb();
  let clients;

  if (user.role === 'admin') {
    clients = db.prepare(`
      SELECT c.*, u.name as linked_user_name, u.email as linked_user_email
      FROM clients c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `).all();
  } else if (user.role === 'collaborator') {
    clients = db.prepare(`
      SELECT DISTINCT c.*, u.name as linked_user_name
      FROM clients c
      JOIN projects p ON p.client_id = c.id
      JOIN collaboration_assignments ca ON ca.project_id = p.id
      LEFT JOIN users u ON c.user_id = u.id
      WHERE ca.collaborator_id = ?
      ORDER BY c.created_at DESC
    `).all(user.userId);
  } else {
    clients = db.prepare('SELECT * FROM clients WHERE user_id = ?').all(user.userId);
  }

  return NextResponse.json({ clients });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const body = await request.json();
  const { name, email, phone, company } = body;

  if (!name) return NextResponse.json({ error: 'Nome richiesto' }, { status: 400 });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO clients (name, email, phone, company, assigned_admin_id) VALUES (?, ?, ?, ?, ?)'
  ).run(name, email || null, phone || null, company || null, user.userId);

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json({ client }, { status: 201 });
}
