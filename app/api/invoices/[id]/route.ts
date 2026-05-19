import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  const { id } = await params;
  const db = getDb();
  const invoice = db.prepare('SELECT i.*, c.name as client_name, p.name as project_name FROM invoices i JOIN clients c ON i.client_id = c.id LEFT JOIN projects p ON i.project_id = p.id WHERE i.id = ?').get(id);
  if (!invoice) return NextResponse.json({ error: 'Fattura non trovata' }, { status: 404 });
  const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY payment_date DESC').all(id);
  const reminders = db.prepare('SELECT pr.*, u.name as triggered_by_name FROM payment_reminders pr JOIN users u ON pr.triggered_by = u.id WHERE pr.invoice_id = ? ORDER BY pr.trigger_date DESC').all(id);
  return NextResponse.json({ invoice, payments, reminders });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  const { id } = await params;
  const body = await request.json();
  const { invoice_number, amount, status, due_date, issued_date, notes } = body;
  const db = getDb();
  db.prepare('UPDATE invoices SET invoice_number=?, amount=?, status=?, due_date=?, issued_date=?, notes=? WHERE id=?')
    .run(invoice_number, amount, status, due_date, issued_date, notes||null, id);

  // If marking as paid, add payment record
  if (status === 'paid' && body.payment_date) {
    db.prepare('INSERT INTO payments (invoice_id, amount_paid, payment_date, method, notes) VALUES (?, ?, ?, ?, ?)')
      .run(id, amount, body.payment_date, body.payment_method||null, body.payment_notes||null);
  }

  const invoice = db.prepare('SELECT i.*, c.name as client_name FROM invoices i JOIN clients c ON i.client_id = c.id WHERE i.id = ?').get(id);
  return NextResponse.json({ invoice });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM invoices WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
