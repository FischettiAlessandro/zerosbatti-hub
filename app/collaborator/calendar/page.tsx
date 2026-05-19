'use client';

import { CalendarView } from '@/components/calendar/CalendarView';

export default function CollabCalendarPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Calendario Editoriale</h1>
        <p className="text-zinc-500 text-sm mt-1">Visualizza tutti gli eventi dei tuoi progetti</p>
      </div>
      <CalendarView canEdit={false} />
    </div>
  );
}
