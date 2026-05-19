import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');

  const base = `SELECT t.*, u.name as assigned_name, p.name as project_name
    FROM tasks t LEFT JOIN users u ON t.assigned_to = u.id
    JOIN projects p ON t.project_id = p.id`;

  let tasks;
  if (user.role === 'admin') {
    tasks = projectId
      ? db.prepare(`${base} WHERE t.project_id = ? ORDER BY t.due_date ASC`).all(projectId)
      : db.prepare(`${base} ORDER BY t.due_date ASC`).all();
  } else if (user.role === 'collaborator') {
    tasks = db.prepare(`
      ${base}
      JOIN collaboration_assignments ca ON ca.project_id = t.project_id
      WHERE ca.collaborator_id = ?
      ${projectId ? 'AND t.project_id = ?' : ''}
      ORDER BY t.due_date ASC
    `).all(...(projectId ? [user.userId, projectId] : [user.userId]));
  } else {
    tasks = db.prepare(`
      ${base}
      JOIN clients c ON p.client_id = c.id
      WHERE c.user_id = ?
      ${projectId ? 'AND t.project_id = ?' : ''}
      ORDER BY t.due_date ASC
    `).all(...(projectId ? [user.userId, projectId] : [user.userId]));
  }

  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role === 'client') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const body = await request.json();
  const { project_id, assigned_to, title, description, status, due_date } = body;
  if (!project_id || !title) return NextResponse.json({ error: 'project_id e title richiesti' }, { status: 400 });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO tasks (project_id, assigned_to, title, description, status, due_date) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(project_id, assigned_to||null, title, description||null, status||'todo', due_date||null);

  // Create notification if task is assigned
  if (assigned_to) {
    db.prepare(
      'INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(assigned_to, 'Nuovo task assegnato', `Ti è stato assegnato il task: ${title}`, 'task', 'task', result.lastInsertRowid);
  }

  const task = db.prepare(`
    SELECT t.*, u.name as assigned_name, p.name as project_name FROM tasks t
    LEFT JOIN users u ON t.assigned_to = u.id JOIN projects p ON t.project_id = p.id WHERE t.id = ?
  `).get(result.lastInsertRowid);
  return NextResponse.json({ task }, { status: 201 });
}
