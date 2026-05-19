'use client';

import { useState, useEffect } from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';

export default function CollabContentPage() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/content').then(r => r.json()).then(d => { setContent(d.content || []); setLoading(false); });
  }, []);

  const typeLabels: Record<string, string> = { copy: '📝 Copy', video: '🎬 Video', script: '📄 Script', creative: '🎨 Creative', campaign_material: '📢 Campaign' };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Contenuti</h1>
        <p className="text-zinc-500 text-sm mt-1">{content.length} contenuti nei tuoi progetti</p>
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
        : content.length === 0 ? <div className="text-center py-16 text-zinc-600"><FileText size={48} className="mx-auto mb-4 opacity-30" /><p>Nessun contenuto</p></div>
        : <div className="space-y-2">
          {content.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-medium text-white">{item.title}</span>
                <span className="text-xs text-zinc-500">{typeLabels[item.type] || item.type}</span>
                <StatusBadge status={item.status} />
              </div>
              <div className="text-xs text-zinc-600 mb-2">📁 {item.project_name}</div>
              {item.description && <p className="text-xs text-zinc-500 mb-2">{item.description}</p>}
              {item.link_url && <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"><ExternalLink size={10} />Apri link esterno</a>}
            </div>
          ))}
        </div>
      }
    </div>
  );
}
