import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';
import { Project } from '@/lib/types';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');

  const base = `SELECT ci.*, p.name as project_name FROM content_items ci JOIN projects p ON ci.project_id = p.id`;
  let content;

  if (user.role === 'admin') {
    content = projectId
      ? db.prepare(`${base} WHERE ci.project_id = ? ORDER BY ci.created_at DESC`).all(projectId)
      : db.prepare(`${base} ORDER BY ci.created_at DESC`).all();
  } else if (user.role === 'collaborator') {
    content = db.prepare(`
      ${base} JOIN collaboration_assignments ca ON ca.project_id = ci.project_id
      WHERE ca.collaborator_id = ? ${projectId ? 'AND ci.project_id = ?' : ''} ORDER BY ci.created_at DESC
    `).all(...(projectId ? [user.userId, projectId] : [user.userId]));
  } else {
    content = db.prepare(`
      ${base} JOIN clients c ON p.client_id = c.id
      WHERE c.user_id = ? ${projectId ? 'AND ci.project_id = ?' : ''} ORDER BY ci.created_at DESC
    `).all(...(projectId ? [user.userId, projectId] : [user.userId]));
  }

  return NextResponse.json({ content });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role === 'client') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const body = await request.json();
  const { project_id, title, type, link_url, description, status, scheduled_date } = body;
  if (!project_id || !title || !type) return NextResponse.json({ error: 'Campi richiesti mancanti' }, { status: 400 });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO content_items (project_id, title, type, link_url, description, status, scheduled_date) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(project_id, title, type, link_url||null, description||null, status||'draft', scheduled_date||null);

  // Notify client about new content
  const project = db.prepare('SELECT p.*, c.user_id as client_user_id FROM projects p JOIN clients c ON p.client_id = c.id WHERE p.id = ?').get(project_id) as (Project & { client_user_id?: number }) | undefined;
  if (project?.client_user_id && (status === 'review' || !status || status === 'draft')) {
    db.prepare('INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(project.client_user_id, 'Nuovo contenuto disponibile', `"${title}" è disponibile nella tua area contenuti`, 'content', 'content', result.lastInsertRowid);
  }

  const item = db.prepare('SELECT ci.*, p.name as project_name FROM content_items ci JOIN projects p ON ci.project_id = p.id WHERE ci.id = ?').get(result.lastInsertRowid);
  return NextResponse.json({ item }, { status: 201 });
}
