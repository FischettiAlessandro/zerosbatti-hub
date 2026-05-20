'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileCheck, Receipt, ExternalLink } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { useAuthStore } from '@/store/auth';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Project, ContentItem, CalendarEvent } from '@/lib/types';

interface ClientDashboardData {
  myProject: Project | null;
  stats: { pendingQuotes: number; pendingInvoices: number };
  recentContent: ContentItem[];
  upcomingEvents: CalendarEvent[];
}

export default function ClientDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Ciao, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-zinc-500 text-sm mt-1">Benvenuto nella tua area clienti ZeroSbatti Social</p>
      </div>

      {/* Project status */}
      {data?.myProject && (
        <div className="bg-gradient-to-r from-red-950/30 to-zinc-900 border border-red-600/20 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Il tuo progetto attivo</p>
              <h2 className="text-xl font-bold text-white">{data.myProject.name}</h2>
              {data.myProject.description && <p className="text-sm text-zinc-400 mt-1">{data.myProject.description}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={data.myProject.status} />
              <Link href="/client/project" className="text-xs text-red-400 hover:text-red-300">Vedi dettagli →</Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatsCard title="Preventivi da approvare" value={data?.stats?.pendingQuotes || 0} icon={FileCheck} accent={data?.stats?.pendingQuotes > 0} subtitle={data?.stats?.pendingQuotes > 0 ? 'Richiede la tua attenzione' : undefined} />
        <StatsCard title="Fatture in attesa" value={data?.stats?.pendingInvoices || 0} icon={Receipt} accent={data?.stats?.pendingInvoices > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Contenuti recenti</h2>
            <Link href="/client/content" className="text-xs text-red-400 hover:text-red-300">Vedi tutti →</Link>
          </div>
          <div className="space-y-2">
            {(data?.recentContent || []).length === 0 ? <p className="text-sm text-zinc-600 py-4 text-center">Nessun contenuto ancora</p> : (data?.recentContent || []).map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{item.title}</div>
                  <div className="text-xs text-zinc-500">{item.type}</div>
                </div>
                <div className="flex items-center gap-2">
                  {item.link_url && <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-red-400"><ExternalLink size={12} /></a>}
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Prossimi appuntamenti</h2>
            <Link href="/client/calendar" className="text-xs text-red-400 hover:text-red-300">Calendario →</Link>
          </div>
          <div className="space-y-2">
            {(data?.upcomingEvents || []).length === 0 ? <p className="text-sm text-zinc-600 py-4 text-center">Nessun evento imminente</p> : (data?.upcomingEvents || []).map((ev) => (
              <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50">
                <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-600/30 flex flex-col items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-red-400">{format(new Date(ev.start_datetime), 'd')}</span>
                  <span className="text-xs text-red-400/70">{format(new Date(ev.start_datetime), 'MMM', { locale: it })}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{ev.title}</div>
                  <div className="text-xs text-zinc-500">{format(new Date(ev.start_datetime), 'HH:mm')} · {ev.event_type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
