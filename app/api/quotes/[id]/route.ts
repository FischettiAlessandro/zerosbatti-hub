import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const quote = db.prepare('SELECT q.*, c.name as client_name, p.name as project_name FROM quotes q JOIN clients c ON q.client_id = c.id LEFT JOIN projects p ON q.project_id = p.id WHERE q.id = ?').get(id);
  if (!quote) return NextResponse.json({ error: 'Preventivo non trovato' }, { status: 404 });
  return NextResponse.json({ quote });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const db = getDb();

  // Client can only accept/reject
  if (user.role === 'client') {
    const { status } = body;
    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Azione non permessa' }, { status: 403 });
    }
    db.prepare('UPDATE quotes SET status = ? WHERE id = ?').run(status, id);
    // Notify admin
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as any[];
    const quote = db.prepare('SELECT title FROM quotes WHERE id = ?').get(id) as any;
    admins.forEach(admin => {
      db.prepare('INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?)')
        .run(admin.id, `Preventivo ${status === 'accepted' ? 'accettato' : 'rifiutato'}`, `Il preventivo "${quote?.title}" è stato ${status === 'accepted' ? 'accettato' : 'rifiutato'} dal cliente`, 'quote', 'quote', id);
    });
  } else if (user.role === 'admin') {
    const { title, description, items, total_amount, status, valid_until, client_id, project_id } = body;
    db.prepare('UPDATE quotes SET title=?, description=?, items_json=?, total_amount=?, status=?, valid_until=?, client_id=?, project_id=? WHERE id=?')
      .run(title, description||null, JSON.stringify(items||[]), total_amount||0, status, valid_until||null, client_id, project_id||null, id);
    // Notify client if being sent
    if (status === 'sent') {
      const quote = db.prepare('SELECT q.*, c.user_id as client_user_id FROM quotes q JOIN clients c ON q.client_id = c.id WHERE q.id = ?').get(id) as any;
      if (quote?.client_user_id) {
        db.prepare('INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?)')
          .run(quote.client_user_id, 'Preventivo aggiornato', `Il preventivo "${title}" è stato aggiornato`, 'quote', 'quote', id);
      }
    }
  } else {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  }

  const quote = db.prepare('SELECT q.*, c.name as client_name FROM quotes q JOIN clients c ON q.client_id = c.id WHERE q.id = ?').get(id);
  return NextResponse.json({ quote });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM quotes WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
