import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const db = getDb();
  const today = new Date().toISOString().split('T')[0];

  // Auto update overdue invoices
  db.prepare("UPDATE invoices SET status = 'overdue' WHERE status = 'pending' AND due_date < ?").run(today);

  if (user.role === 'admin') {
    const totalClients = (db.prepare('SELECT COUNT(*) as c FROM clients').get() as any)?.c || 0;
    const activeProjects = (db.prepare("SELECT COUNT(*) as c FROM projects WHERE status = 'active'").get() as any)?.c || 0;
    const pendingTasks = (db.prepare("SELECT COUNT(*) as c FROM tasks WHERE status != 'done'").get() as any)?.c || 0;
    const pendingInvoices = (db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'pending'").get() as any)?.total || 0;
    const overdueInvoices = (db.prepare("SELECT COUNT(*) as c FROM invoices WHERE status = 'overdue'").get() as any)?.c || 0;
    const contentReview = (db.prepare("SELECT COUNT(*) as c FROM content_items WHERE status = 'review'").get() as any)?.c || 0;
    const pendingQuotes = (db.prepare("SELECT COUNT(*) as c FROM quotes WHERE status = 'sent'").get() as any)?.c || 0;
    const recentClients = db.prepare("SELECT * FROM clients ORDER BY created_at DESC LIMIT 5").all();
    const recentProjects = db.prepare("SELECT p.*, c.name as client_name FROM projects p JOIN clients c ON p.client_id = c.id ORDER BY p.created_at DESC LIMIT 5").all();

    return NextResponse.json({
      stats: { totalClients, activeProjects, pendingTasks, pendingInvoices, overdueInvoices, contentReview, pendingQuotes },
      recentClients,
      recentProjects,
    });
  } else if (user.role === 'collaborator') {
    const myProjects = (db.prepare("SELECT COUNT(*) as c FROM collaboration_assignments WHERE collaborator_id = ?").get(user.userId) as any)?.c || 0;
    const myTasks = db.prepare(`
      SELECT t.*, p.name as project_name FROM tasks t
      JOIN collaboration_assignments ca ON ca.project_id = t.project_id
      JOIN projects p ON t.project_id = p.id
      WHERE ca.collaborator_id = ? AND t.status != 'done' ORDER BY t.due_date ASC LIMIT 10
    `).all(user.userId);
    const upcomingEvents = db.prepare(`
      SELECT ce.*, p.name as project_name FROM calendar_events ce
      JOIN collaboration_assignments ca ON ca.project_id = ce.project_id
      LEFT JOIN projects p ON ce.project_id = p.id
      WHERE ca.collaborator_id = ? AND ce.start_datetime >= datetime('now') ORDER BY ce.start_datetime ASC LIMIT 5
    `).all(user.userId);

    return NextResponse.json({ stats: { myProjects, pendingTasks: myTasks.length }, myTasks, upcomingEvents });
  } else {
    // client
    const myProject = db.prepare(`
      SELECT p.*, c.name as client_name FROM projects p
      JOIN clients c ON p.client_id = c.id WHERE c.user_id = ? ORDER BY p.created_at DESC LIMIT 1
    `).get(user.userId) as any;

    const pendingQuotes = (db.prepare(`
      SELECT COUNT(*) as c FROM quotes q JOIN clients c ON q.client_id = c.id WHERE c.user_id = ? AND q.status = 'sent'
    `).get(user.userId) as any)?.c || 0;

    const pendingInvoices = (db.prepare(`
      SELECT COUNT(*) as c FROM invoices i JOIN clients c ON i.client_id = c.id WHERE c.user_id = ? AND i.status = 'pending'
    `).get(user.userId) as any)?.c || 0;

    const recentContent = myProject ? db.prepare(`
      SELECT * FROM content_items WHERE project_id = ? ORDER BY created_at DESC LIMIT 5
    `).all(myProject.id) : [];

    const upcomingEvents = myProject ? db.prepare(`
      SELECT * FROM calendar_events WHERE project_id = ? AND start_datetime >= datetime('now') ORDER BY start_datetime ASC LIMIT 5
    `).all(myProject.id) : [];

    return NextResponse.json({ myProject, stats: { pendingQuotes, pendingInvoices }, recentContent, upcomingEvents });
  }
}
