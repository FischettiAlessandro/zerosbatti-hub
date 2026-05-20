import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const db = getDb();
  const base = `SELECT q.*, c.name as client_name, p.name as project_name
    FROM quotes q JOIN clients c ON q.client_id = c.id LEFT JOIN projects p ON q.project_id = p.id`;

  let quotes;
  if (user.role === 'admin') {
    quotes = db.prepare(`${base} ORDER BY q.created_at DESC`).all();
  } else if (user.role === 'client') {
    quotes = db.prepare(`${base} JOIN clients cl ON q.client_id = cl.id WHERE cl.user_id = ? AND q.status != 'draft' ORDER BY q.created_at DESC`).all(user.userId);
  } else {
    quotes = db.prepare(`
      ${base} JOIN collaboration_assignments ca ON ca.project_id = q.project_id
      WHERE ca.collaborator_id = ? ORDER BY q.created_at DESC
    `).all(user.userId);
  }

  return NextResponse.json({ quotes });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const body = await request.json();
  const { client_id, project_id, title, description, items, total_amount, status, valid_until } = body;
  if (!client_id || !title) return NextResponse.json({ error: 'Campi richiesti mancanti' }, { status: 400 });

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO quotes (client_id, project_id, title, description, items_json, total_amount, status, valid_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(client_id, project_id||null, title, description||null, JSON.stringify(items||[]), total_amount||0, status||'draft', valid_until||null);

  // Notify client if status is sent
  if (status === 'sent') {
    const client = db.prepare('SELECT user_id FROM clients WHERE id = ?').get(client_id) as { user_id?: number } | undefined;
    if (client?.user_id) {
      db.prepare('INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?)')
        .run(client.user_id, 'Nuovo preventivo disponibile', `Il preventivo "${title}" è disponibile per la tua approvazione`, 'quote', 'quote', result.lastInsertRowid);
    }
  }

  const quote = db.prepare('SELECT q.*, c.name as client_name FROM quotes q JOIN clients c ON q.client_id = c.id WHERE q.id = ?').get(result.lastInsertRowid);
  return NextResponse.json({ quote }, { status: 201 });
}
