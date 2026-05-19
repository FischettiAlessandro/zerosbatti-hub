import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role === 'client') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { title, type, link_url, description, status, scheduled_date } = body;
  const db = getDb();
  db.prepare('UPDATE content_items SET title=?, type=?, link_url=?, description=?, status=?, scheduled_date=? WHERE id=?')
    .run(title, type, link_url||null, description||null, status, scheduled_date||null, id);
  const item = db.prepare('SELECT ci.*, p.name as project_name FROM content_items ci JOIN projects p ON ci.project_id = p.id WHERE ci.id = ?').get(id);
  return NextResponse.json({ item });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM content_items WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
