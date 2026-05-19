'use client';

import { useState, useEffect } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function ClientContentPage() {
  const [content, setContent] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/content').then(r => r.json()).then(d => { setContent(d.content || []); setLoading(false); });
  }, []);

  const typeLabels: Record<string, string> = { copy: '📝 Copy', video: '🎬 Video', script: '📄 Script', creative: '🎨 Creative', campaign_material: '📢 Campaign' };
  const filtered = filter === 'all' ? content : content.filter(c => c.status === filter);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">I miei Contenuti</h1>
        <p className="text-zinc-500 text-sm mt-1">Tutti i contenuti prodotti per il tuo progetto</p>
      </div>

      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-4 w-fit overflow-x-auto">
        {[['all', 'Tutti'], ['draft', 'Bozze'], ['review', 'In revisione'], ['approved', 'Approvati'], ['published', 'Pubblicati']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${filter === val ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>{label}</button>
        ))}
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
        : filtered.length === 0 ? <div className="text-center py-16 text-zinc-600"><FileText size={48} className="mx-auto mb-4 opacity-30" /><p>Nessun contenuto</p></div>
        : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-white mb-0.5">{item.title}</h3>
                  <span className="text-xs text-zinc-500">{typeLabels[item.type] || item.type}</span>
                </div>
                <StatusBadge status={item.status} />
              </div>
              {item.description && <p className="text-sm text-zinc-400 mb-3">{item.description}</p>}
              <div className="flex items-center gap-3">
                {item.link_url && (
                  <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 bg-red-950/20 border border-red-900/30 px-3 py-1.5 rounded-lg">
                    <ExternalLink size={12} />Apri contenuto
                  </a>
                )}
                {item.scheduled_date && <span className="text-xs text-zinc-600">📅 {format(new Date(item.scheduled_date), 'd MMM yyyy', { locale: it })}</span>}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
