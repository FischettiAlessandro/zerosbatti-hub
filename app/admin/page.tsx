'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, FolderOpen, CheckSquare, Receipt, FileCheck, AlertTriangle, Clock } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Client, Project } from '@/lib/types';

interface AdminDashboardData {
  stats: { totalClients: number; activeProjects: number; pendingTasks: number; pendingInvoices: number; overdueInvoices: number; contentReview: number; pendingQuotes: number };
  recentClients: Client[];
  recentProjects: (Project & { client_name?: string })[];
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Panoramica del sistema — ZeroSbatti Social</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard title="Clienti totali" value={data?.stats?.totalClients || 0} icon={Users} />
        <StatsCard title="Progetti attivi" value={data?.stats?.activeProjects || 0} icon={FolderOpen} />
        <StatsCard title="Task aperti" value={data?.stats?.pendingTasks || 0} icon={CheckSquare} />
        <StatsCard
          title="Fatture in attesa"
          value={`€${(data?.stats?.pendingInvoices || 0).toLocaleString('it-IT', { minimumFractionDigits: 0 })}`}
          icon={Receipt}
          accent={data?.stats?.overdueInvoices > 0}
          subtitle={data?.stats?.overdueInvoices > 0 ? `⚠️ ${data?.stats?.overdueInvoices} scadute` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <StatsCard title="Contenuti in revisione" value={data?.stats?.contentReview || 0} icon={Clock} subtitle="In attesa di approvazione" />
        <StatsCard title="Preventivi inviati" value={data?.stats?.pendingQuotes || 0} icon={FileCheck} subtitle="In attesa di risposta" />
        <StatsCard title="Fatture scadute" value={data?.stats?.overdueInvoices || 0} icon={AlertTriangle} accent={data?.stats?.overdueInvoices > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent clients */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Clienti recenti</h2>
            <Link href="/admin/clients" className="text-xs text-red-400 hover:text-red-300">Vedi tutti →</Link>
          </div>
          <div className="space-y-3">
            {(data?.recentClients || []).length === 0 ? (
              <p className="text-sm text-zinc-600">Nessun cliente ancora</p>
            ) : (
              data.recentClients.map((c) => (
                <Link key={c.id} href={`/admin/clients/${c.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-800 transition-colors group">
                  <div className="w-9 h-9 bg-zinc-800 group-hover:bg-zinc-700 rounded-full flex items-center justify-center text-sm font-bold text-zinc-400">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{c.name}</div>
                    <div className="text-xs text-zinc-500 truncate">{c.company || c.email || '—'}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent projects */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Progetti recenti</h2>
            <Link href="/admin/projects" className="text-xs text-red-400 hover:text-red-300">Vedi tutti →</Link>
          </div>
          <div className="space-y-3">
            {(data?.recentProjects || []).length === 0 ? (
              <p className="text-sm text-zinc-600">Nessun progetto ancora</p>
            ) : (
              data.recentProjects.map((p) => (
                <Link key={p.id} href={`/admin/projects/${p.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{p.name}</div>
                    <div className="text-xs text-zinc-500">{p.client_name}</div>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
