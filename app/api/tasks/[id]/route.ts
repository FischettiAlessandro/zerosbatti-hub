import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role === 'client') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { title, description, status, due_date, assigned_to } = body;
  const db = getDb();
  db.prepare('UPDATE tasks SET title=?, description=?, status=?, due_date=?, assigned_to=? WHERE id=?')
    .run(title, description||null, status, due_date||null, assigned_to||null, id);
  const task = db.prepare(`
    SELECT t.*, u.name as assigned_name, p.name as project_name FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id JOIN projects p ON t.project_id = p.id WHERE t.id = ?
  `).get(id);
  return NextResponse.json({ task });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
