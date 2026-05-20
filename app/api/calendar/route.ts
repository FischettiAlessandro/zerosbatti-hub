import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');
  const month = searchParams.get('month'); // YYYY-MM

  const base = `SELECT ce.*, p.name as project_name FROM calendar_events ce LEFT JOIN projects p ON ce.project_id = p.id`;
  let events;

  if (user.role === 'admin') {
    let q = base;
    const conditions = [];
    if (projectId) conditions.push(`ce.project_id = ?`);
    if (month) conditions.push(`strftime('%Y-%m', ce.start_datetime) = ?`);
    const args: (string | number)[] = [];
    if (projectId) args.push(projectId);
    if (month) args.push(month);
    if (conditions.length) q += ` WHERE ${conditions.join(' AND ')}`;
    q += ' ORDER BY ce.start_datetime ASC';
    events = db.prepare(q).all(...args);
  } else if (user.role === 'collaborator') {
    const args: (string | number)[] = [user.userId];
    let q = `${base} JOIN collaboration_assignments ca ON ca.project_id = ce.project_id WHERE ca.collaborator_id = ?`;
    if (projectId) { q += ' AND ce.project_id = ?'; args.push(projectId); }
    if (month) { q += ` AND strftime('%Y-%m', ce.start_datetime) = ?`; args.push(month); }
    q += ' ORDER BY ce.start_datetime ASC';
    events = db.prepare(q).all(...args);
  } else {
    const args: (string | number)[] = [user.userId];
    let q = `${base} JOIN projects proj ON ce.project_id = proj.id JOIN clients c ON proj.client_id = c.id WHERE c.user_id = ?`;
    if (projectId) { q += ' AND ce.project_id = ?'; args.push(projectId); }
    if (month) { q += ` AND strftime('%Y-%m', ce.start_datetime) = ?`; args.push(month); }
    q += ' ORDER BY ce.start_datetime ASC';
    events = db.prepare(q).all(...args);
  }

  return NextResponse.json({ events });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role === 'client') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const body = await request.json();
  const { project_id, title, description, start_datetime, end_datetime, event_type } = body;
  if (!title || !start_datetime || !end_datetime) return NextResponse.json({ error: 'Campi richiesti mancanti' }, { status: 400 });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO calendar_events (project_id, title, description, start_datetime, end_datetime, event_type) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(project_id||null, title, description||null, start_datetime, end_datetime, event_type||'content');

  const event = db.prepare('SELECT ce.*, p.name as project_name FROM calendar_events ce LEFT JOIN projects p ON ce.project_id = p.id WHERE ce.id = ?').get(result.lastInsertRowid);
  return NextResponse.json({ event }, { status: 201 });
}
