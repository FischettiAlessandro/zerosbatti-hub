import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const db = getDb();
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(user.userId);
  const unreadCount = (db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(user.userId) as { count: number } | undefined)?.count || 0;
  return NextResponse.json({ notifications, unreadCount });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const body = await request.json();
  const { user_id, title, message, type } = body;
  const db = getDb();
  const result = db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)').run(user_id, title, message, type||'system');
  const notif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid);
  return NextResponse.json({ notification: notif }, { status: 201 });
}
