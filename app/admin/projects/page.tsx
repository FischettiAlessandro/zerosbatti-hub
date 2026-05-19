'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, FolderOpen, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => { setProjects(d.projects || []); setLoading(false); });
  }, []);

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Progetti</h1>
          <p className="text-zinc-500 text-sm mt-1">{projects.length} progetti totali</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Cerca progetti..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600" />
        </div>
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {[['all', 'Tutti'], ['active', 'Attivi'], ['paused', 'Pausa'], ['completed', 'Completati']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === val ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-600"><FolderOpen size={48} className="mx-auto mb-4 opacity-30" /><p>Nessun progetto trovato</p></div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">Progetto</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Cliente</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Inizio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/admin/projects/${p.id}`} className="font-medium text-white hover:text-red-300 transition-colors">{p.name}</Link>
                    {p.description && <p className="text-xs text-zinc-600 mt-0.5 hidden sm:block">{p.description.substring(0, 60)}...</p>}
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-400 hidden md:table-cell">{p.client_name}</td>
                  <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                  <td className="px-5 py-4 text-sm text-zinc-500 hidden lg:table-cell">
                    {p.start_date ? format(new Date(p.start_date), 'd MMM yyyy', { locale: it }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
