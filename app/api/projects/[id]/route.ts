import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  const { id } = await params;
  const db = getDb();

  const project = db.prepare(`
    SELECT p.*, c.name as client_name, c.email as client_email, c.company as client_company
    FROM projects p JOIN clients c ON p.client_id = c.id WHERE p.id = ?
  `).get(id) as any;
  if (!project) return NextResponse.json({ error: 'Progetto non trovato' }, { status: 404 });

  const tasks = db.prepare(`
    SELECT t.*, u.name as assigned_name FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE t.project_id = ? ORDER BY t.created_at DESC
  `).all(id);

  const content = db.prepare('SELECT * FROM content_items WHERE project_id = ? ORDER BY created_at DESC').all(id);
  const team = db.prepare(`
    SELECT ca.*, u.name, u.email, u.role FROM collaboration_assignments ca
    JOIN users u ON ca.collaborator_id = u.id WHERE ca.project_id = ?
  `).all(id);
  const comments = db.prepare(`
    SELECT cm.*, u.name as author_name, u.role as author_role FROM comments cm
    JOIN users u ON cm.author_id = u.id WHERE cm.project_id = ? ORDER BY cm.created_at ASC
  `).all(id);

  return NextResponse.json({ project, tasks, content, team, comments });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { name, description, status, start_date, end_date } = body;
  const db = getDb();
  db.prepare('UPDATE projects SET name=?, description=?, status=?, start_date=?, end_date=? WHERE id=?')
    .run(name, description||null, status||'active', start_date||null, end_date||null, id);
  const project = db.prepare('SELECT p.*, c.name as client_name FROM projects p JOIN clients c ON p.client_id = c.id WHERE p.id = ?').get(id);
  return NextResponse.json({ project });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
