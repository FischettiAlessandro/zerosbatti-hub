'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Download, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { it } from 'date-fns/locale';
import { CalendarEvent } from '@/lib/types';
import { cn } from '@/lib/utils';

const eventTypeColors: Record<string, string> = {
  content: 'bg-blue-600/80 border-blue-500',
  task: 'bg-yellow-600/80 border-yellow-500',
  meeting: 'bg-purple-600/80 border-purple-500',
  deadline: 'bg-red-600/80 border-red-500',
  campaign: 'bg-green-600/80 border-green-500',
};

interface CalendarViewProps {
  projectId?: number;
  canEdit?: boolean;
  onAddEvent?: () => void;
}

export function CalendarView({ projectId, canEdit = false, onAddEvent }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  async function fetchEvents() {
    const month = format(currentDate, 'yyyy-MM');
    const url = `/api/calendar?${projectId ? `project_id=${projectId}&` : ''}month=${month}`;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch {}
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, view]);

  function getEventsForDay(day: Date) {
    return events.filter(ev => isSameDay(new Date(ev.start_datetime), day));
  }

  function handleExport() {
    const url = `/api/calendar/export${projectId ? `?project_id=${projectId}` : ''}`;
    window.location.href = url;
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <div>
        <div className="grid grid-cols-7 mb-1">
          {weekDays.map(d => (
            <div key={d} className="text-center text-xs font-medium text-zinc-500 py-2">{d}</div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-px bg-zinc-800">
            {week.map((day, di) => {
              const dayEvents = getEventsForDay(day);
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentDate);
              return (
                <div
                  key={di}
                  className={cn(
                    'min-h-[100px] p-1 bg-zinc-950',
                    !isCurrentMonth && 'opacity-40'
                  )}
                >
                  <div className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium mb-1',
                    isToday ? 'bg-red-600 text-white' : 'text-zinc-400'
                  )}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className={cn(
                          'w-full text-left text-xs px-1.5 py-0.5 rounded border truncate',
                          eventTypeColors[ev.event_type] || 'bg-zinc-700 border-zinc-600',
                          'text-white hover:opacity-90 transition-opacity'
                        )}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-zinc-500 px-1">+{dayEvents.length - 3} altri</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-8 border-b border-zinc-800">
            <div className="p-2 text-xs text-zinc-600">Ora</div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className={cn(
                'p-2 text-center',
                isSameDay(day, new Date()) && 'bg-red-600/10'
              )}>
                <div className="text-xs text-zinc-500">{format(day, 'EEE', { locale: it })}</div>
                <div className={cn(
                  'text-lg font-bold',
                  isSameDay(day, new Date()) ? 'text-red-400' : 'text-white'
                )}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>
          <div className="overflow-y-auto max-h-96">
            {hours.slice(8, 20).map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b border-zinc-800/50 min-h-[50px]">
                <div className="p-2 text-xs text-zinc-600 text-right pr-3">{`${hour}:00`}</div>
                {weekDays.map(day => {
                  const dayEvents = getEventsForDay(day).filter(ev => {
                    const evHour = new Date(ev.start_datetime).getHours();
                    return evHour === hour;
                  });
                  return (
                    <div key={day.toISOString()} className={cn(
                      'border-l border-zinc-800/50 p-0.5',
                      isSameDay(day, new Date()) && 'bg-red-600/5'
                    )}>
                      {dayEvents.map(ev => (
                        <button
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={cn(
                            'w-full text-left text-xs px-1.5 py-1 rounded border mb-0.5',
                            eventTypeColors[ev.event_type] || 'bg-zinc-700 border-zinc-600',
                            'text-white hover:opacity-90 transition-opacity truncate'
                          )}
                        >
                          {ev.title}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                view === 'month' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              )}
            >
              Mese
            </button>
            <button
              onClick={() => setView('week')}
              className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                view === 'week' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              )}
            >
              Settimana
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-white min-w-[140px] text-center">
              {view === 'month'
                ? format(currentDate, 'MMMM yyyy', { locale: it })
                : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM', { locale: it })} – ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: it })}`
              }
            </span>
            <button
              onClick={() => setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-600 gap-1.5"
          >
            <Download size={14} />
            Esporta .ics
          </Button>
          {canEdit && onAddEvent && (
            <Button size="sm" onClick={onAddEvent} className="bg-red-600 hover:bg-red-700 gap-1.5">
              <Plus size={14} />
              Evento
            </Button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-zinc-800 overflow-x-auto">
        {Object.entries({ content: 'Contenuto', task: 'Task', meeting: 'Meeting', deadline: 'Scadenza', campaign: 'Campagna' }).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-zinc-500 whitespace-nowrap">
            <span className={cn('w-3 h-3 rounded-sm', eventTypeColors[key].split(' ')[0])} />
            {label}
          </div>
        ))}
      </div>

      {/* Calendar body */}
      <div className="p-0">
        {view === 'month' ? renderMonthView() : renderWeekView()}
      </div>

      {/* Event detail modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setSelectedEvent(null)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <span className={cn('w-3 h-3 rounded-sm', eventTypeColors[selectedEvent.event_type]?.split(' ')[0])} />
              <h3 className="font-semibold text-white text-lg">{selectedEvent.title}</h3>
            </div>
            {selectedEvent.project_name && (
              <p className="text-sm text-zinc-500 mb-2">📁 {selectedEvent.project_name}</p>
            )}
            <p className="text-sm text-zinc-400 mb-2">
              🕐 {format(new Date(selectedEvent.start_datetime), 'dd/MM/yyyy HH:mm')} →{' '}
              {format(new Date(selectedEvent.end_datetime), 'HH:mm')}
            </p>
            {selectedEvent.description && (
              <p className="text-sm text-zinc-400 mt-3 p-3 bg-zinc-800 rounded-lg">{selectedEvent.description}</p>
            )}
            <Button className="mt-4 w-full" variant="outline" onClick={() => setSelectedEvent(null)}>
              Chiudi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
