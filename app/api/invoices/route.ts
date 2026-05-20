import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const db = getDb();
  const base = `SELECT i.*, c.name as client_name, p.name as project_name
    FROM invoices i JOIN clients c ON i.client_id = c.id LEFT JOIN projects p ON i.project_id = p.id`;

  let invoices;
  if (user.role === 'admin') {
    invoices = db.prepare(`${base} ORDER BY i.issued_date DESC`).all();
  } else if (user.role === 'client') {
    invoices = db.prepare(`${base} JOIN clients cl ON i.client_id = cl.id WHERE cl.user_id = ? ORDER BY i.issued_date DESC`).all(user.userId);
  } else {
    invoices = db.prepare(`
      ${base} JOIN collaboration_assignments ca ON ca.project_id = i.project_id
      WHERE ca.collaborator_id = ? ORDER BY i.issued_date DESC
    `).all(user.userId);
  }

  // Auto-update overdue status
  const today = new Date().toISOString().split('T')[0];
  db.prepare("UPDATE invoices SET status = 'overdue' WHERE status = 'pending' AND due_date < ?").run(today);

  return NextResponse.json({ invoices });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const body = await request.json();
  const { client_id, project_id, invoice_number, amount, status, due_date, issued_date, notes } = body;
  if (!client_id || !invoice_number || !amount || !due_date || !issued_date) {
    return NextResponse.json({ error: 'Campi richiesti mancanti' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(
    'INSERT INTO invoices (client_id, project_id, invoice_number, amount, status, due_date, issued_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(client_id, project_id||null, invoice_number, amount, status||'pending', due_date, issued_date, notes||null);

  // Notify client
  const client = db.prepare('SELECT user_id FROM clients WHERE id = ?').get(client_id) as { user_id?: number } | undefined;
  if (client?.user_id) {
    db.prepare('INSERT INTO notifications (user_id, title, message, type, related_entity_type, related_entity_id) VALUES (?, ?, ?, ?, ?, ?)')
      .run(client.user_id, 'Nuova fattura', `Fattura ${invoice_number} di €${amount} disponibile`, 'invoice', 'invoice', result.lastInsertRowid);
  }

  const invoice = db.prepare('SELECT i.*, c.name as client_name FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.id = ?').get(result.lastInsertRowid);
  return NextResponse.json({ invoice }, { status: 201 });
}
