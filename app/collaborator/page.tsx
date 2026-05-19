'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FolderOpen, CheckSquare, Calendar } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { useAuthStore } from '@/store/auth';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function CollaboratorDashboard() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Ciao, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-zinc-500 text-sm mt-1">Ecco un riepilogo della tua attività</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatsCard title="Progetti assegnati" value={data?.stats?.myProjects || 0} icon={FolderOpen} />
        <StatsCard title="Task aperti" value={data?.stats?.pendingTasks || 0} icon={CheckSquare} accent={data?.stats?.pendingTasks > 5} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">I miei task</h2>
            <Link href="/collaborator/tasks" className="text-xs text-red-400 hover:text-red-300">Vedi tutti →</Link>
          </div>
          <div className="space-y-2">
            {(data?.myTasks || []).length === 0 ? (
              <p className="text-sm text-zinc-600 py-4 text-center">Nessun task aperto 🎉</p>
            ) : (
              (data?.myTasks || []).map((task: any) => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{task.title}</div>
                    <div className="text-xs text-zinc-500">{task.project_name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.due_date && <span className={`text-xs ${new Date(task.due_date) < new Date() ? 'text-red-400' : 'text-zinc-500'}`}>{format(new Date(task.due_date), 'd MMM', { locale: it })}</span>}
                    <StatusBadge status={task.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Prossimi eventi</h2>
            <Link href="/collaborator/calendar" className="text-xs text-red-400 hover:text-red-300">Calendario →</Link>
          </div>
          <div className="space-y-2">
            {(data?.upcomingEvents || []).length === 0 ? (
              <p className="text-sm text-zinc-600 py-4 text-center">Nessun evento imminente</p>
            ) : (
              (data?.upcomingEvents || []).map((ev: any) => (
                <div key={ev.id} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50">
                  <div className="w-10 h-10 rounded-lg bg-red-600/20 border border-red-600/30 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-red-400">{format(new Date(ev.start_datetime), 'd', { locale: it })}</span>
                    <span className="text-xs text-red-400/70">{format(new Date(ev.start_datetime), 'MMM', { locale: it })}</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{ev.title}</div>
                    <div className="text-xs text-zinc-500">{format(new Date(ev.start_datetime), 'HH:mm')} · {ev.project_name || 'Evento globale'}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
