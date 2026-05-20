import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';
import { createEvents } from 'ics';
import { CalendarEvent } from '@/lib/types';

export async function GET(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const db = getDb();
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('project_id');

  let events: CalendarEvent[];
  if (user.role === 'admin') {
    events = projectId
      ? db.prepare('SELECT * FROM calendar_events WHERE project_id = ? ORDER BY start_datetime ASC').all(projectId) as CalendarEvent[]
      : db.prepare('SELECT * FROM calendar_events ORDER BY start_datetime ASC').all() as CalendarEvent[];
  } else if (user.role === 'collaborator') {
    events = db.prepare(`
      SELECT ce.* FROM calendar_events ce
      JOIN collaboration_assignments ca ON ca.project_id = ce.project_id
      WHERE ca.collaborator_id = ? ${projectId ? 'AND ce.project_id = ?' : ''}
      ORDER BY ce.start_datetime ASC
    `).all(...(projectId ? [user.userId, projectId] : [user.userId])) as CalendarEvent[];
  } else {
    events = db.prepare(`
      SELECT ce.* FROM calendar_events ce
      JOIN projects p ON ce.project_id = p.id
      JOIN clients c ON p.client_id = c.id
      WHERE c.user_id = ? ${projectId ? 'AND ce.project_id = ?' : ''}
      ORDER BY ce.start_datetime ASC
    `).all(...(projectId ? [user.userId, projectId] : [user.userId])) as CalendarEvent[];
  }

  const icsEvents = events.map((ev: CalendarEvent) => {
    const start = new Date(ev.start_datetime);
    const end = new Date(ev.end_datetime);
    return {
      title: ev.title,
      description: ev.description || '',
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate(), start.getHours(), start.getMinutes()] as [number, number, number, number, number],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate(), end.getHours(), end.getMinutes()] as [number, number, number, number, number],
      uid: `zerosbatti-event-${ev.id}@zerosbattisocial.it`,
    };
  });

  const { error, value } = createEvents(icsEvents);
  if (error || !value) {
    return NextResponse.json({ error: 'Errore generazione ICS' }, { status: 500 });
  }

  return new NextResponse(value, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="calendario-zerosbatti.ics"',
    },
  });
}
