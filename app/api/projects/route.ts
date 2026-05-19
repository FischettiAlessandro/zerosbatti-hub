import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');

  let projects;
  const base = `SELECT p.*, c.name as client_name FROM projects p JOIN clients c ON p.client_id = c.id`;

  if (user.role === 'admin') {
    if (clientId) {
      projects = db.prepare(`${base} WHERE p.client_id = ? ORDER BY p.created_at DESC`).all(clientId);
    } else {
      projects = db.prepare(`${base} ORDER BY p.created_at DESC`).all();
    }
  } else if (user.role === 'collaborator') {
    projects = db.prepare(`
      ${base}
      JOIN collaboration_assignments ca ON ca.project_id = p.id
      WHERE ca.collaborator_id = ?
      ORDER BY p.created_at DESC
    `).all(user.userId);
  } else {
    // client
    projects = db.prepare(`
      ${base}
      JOIN clients cl ON p.client_id = cl.id
      WHERE cl.user_id = ?
      ORDER BY p.created_at DESC
    `).all(user.userId);
  }

  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const body = await request.json();
  const { client_id, name, description, status, start_date, end_date } = body;
  if (!client_id || !name) return NextResponse.json({ error: 'client_id e name richiesti' }, { status: 400 });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO projects (client_id, name, description, status, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(client_id, name, description||null, status||'active', start_date||null, end_date||null);

  const project = db.prepare('SELECT p.*, c.name as client_name FROM projects p JOIN clients c ON p.client_id = c.id WHERE p.id = ?').get(result.lastInsertRowid);
  return NextResponse.json({ project }, { status: 201 });
}
