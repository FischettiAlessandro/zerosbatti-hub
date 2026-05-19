'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FolderOpen } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';

export default function CollaboratorProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(d => { setProjects(d.projects || []); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">I miei Progetti</h1>
        <p className="text-zinc-500 text-sm mt-1">{projects.length} progetti assegnati</p>
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
        : projects.length === 0 ? <div className="text-center py-16 text-zinc-600"><FolderOpen size={48} className="mx-auto mb-4 opacity-30" /><p>Nessun progetto assegnato</p></div>
        : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => (
            <Link key={p.id} href={`/collaborator/projects/${p.id}`}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-all cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-white group-hover:text-red-300 transition-colors flex-1 mr-2">{p.name}</h3>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-sm text-zinc-500 mb-2">{p.client_name}</p>
                {p.description && <p className="text-xs text-zinc-600 line-clamp-2">{p.description}</p>}
              </div>
            </Link>
          ))}
        </div>
      }
    </div>
  );
}
