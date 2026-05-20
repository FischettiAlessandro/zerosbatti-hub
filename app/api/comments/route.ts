import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';
import { Project, CollaborationAssignment, User } from '@/lib/types';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  const contentId = searchParams.get('content_item_id');

  const db = getDb();
  let comments;
  const base = `SELECT cm.*, u.name as author_name, u.role as author_role FROM comments cm JOIN users u ON cm.author_id = u.id`;

  if (projectId) {
    comments = db.prepare(`${base} WHERE cm.project_id = ? ORDER BY cm.created_at ASC`).all(projectId);
  } else if (contentId) {
    comments = db.prepare(`${base} WHERE cm.content_item_id = ? ORDER BY cm.created_at ASC`).all(contentId);
  } else {
    return NextResponse.json({ error: 'project_id o content_item_id richiesto' }, { status: 400 });
  }

  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const body = await request.json();
  const { project_id, content_item_id, message } = body;
  if (!message) return NextResponse.json({ error: 'Messaggio richiesto' }, { status: 400 });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO comments (project_id, content_item_id, author_id, message) VALUES (?, ?, ?, ?)'
  ).run(project_id||null, content_item_id||null, user.userId, message);

  // Notify relevant users about the new comment
  if (project_id) {
    const project = db.prepare('SELECT p.*, c.user_id as client_user_id FROM projects p JOIN clients c ON p.client_id = c.id WHERE p.id = ?').get(project_id) as (Project & { client_user_id?: number }) | undefined;
    const teamMembers = db.prepare('SELECT collaborator_id FROM collaboration_assignments WHERE project_id = ?').all(project_id) as CollaborationAssignment[];
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as Pick<User, 'id'>[];

    const notifyIds = new Set<number>();
    if (project?.client_user_id && project.client_user_id !== user.userId) notifyIds.add(project.client_user_id);
    teamMembers.forEach(m => { if (m.collaborator_id !== user.userId) notifyIds.add(m.collaborator_id); });
    admins.forEach(a => { if (a.id !== user.userId) notifyIds.add(a.id); });

    notifyIds.forEach(uid => {
      db.prepare('INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?)')
        .run(uid, 'Nuovo commento', `${user.name} ha commentato sul progetto`, 'comment', 'project', project_id);
    });
  }

  const comment = db.prepare('SELECT cm.*, u.name as author_name, u.role as author_role FROM comments cm JOIN users u ON cm.author_id = u.id WHERE cm.id = ?').get(result.lastInsertRowid);
  return NextResponse.json({ comment }, { status: 201 });
}
