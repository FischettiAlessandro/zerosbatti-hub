'use client';

import { CalendarView } from '@/components/calendar/CalendarView';

export default function ClientCalendarPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Calendario Editoriale</h1>
        <p className="text-zinc-500 text-sm mt-1">Visualizza il piano dei contenuti e degli appuntamenti. Esporta in .ics per aggiungerlo al tuo calendario.</p>
      </div>
      <CalendarView canEdit={false} />
    </div>
  );
}
