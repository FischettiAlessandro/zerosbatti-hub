'use client';

import { useState, useEffect } from 'react';
import { Search, FileText, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ContentItem } from '@/lib/types';

export default function ContentPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/content').then(r => r.json()).then(d => { setContent(d.content || []); setLoading(false); });
  }, []);

  async function handleStatusChange(itemId: number, status: string) {
    const item = content.find(c => c.id === itemId);
    if (!item) return;
    const res = await fetch(`/api/content/${itemId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, status }) });
    if (res.ok) { const d = await res.json(); setContent(prev => prev.map(c => c.id === itemId ? d.item : c)); toast.success('Status aggiornato'); }
  }

  const typeLabels: Record<string, string> = { copy: '📝 Copy', video: '🎬 Video', script: '📄 Script', creative: '🎨 Creative', campaign_material: '📢 Campaign' };

  const filtered = content.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.project_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter || c.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Contenuti</h1>
        <p className="text-zinc-500 text-sm mt-1">{content.length} contenuti totali</p>
      </div>

      <div className="flex gap-3 mb-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Cerca contenuti..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-zinc-900 border-zinc-800 text-white" />
        </div>
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 overflow-x-auto">
          {[['all', 'Tutti'], ['draft', 'Bozza'], ['review', 'Review'], ['approved', 'Approvati'], ['published', 'Pubblicati']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${filter === val ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-600"><FileText size={48} className="mx-auto mb-4 opacity-30" /><p>Nessun contenuto trovato</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-medium text-white">{item.title}</span>
                  <span className="text-xs text-zinc-500">{typeLabels[item.type] || item.type}</span>
                  <StatusBadge status={item.status} />
                </div>
                <div className="text-xs text-zinc-600 mb-1">📁 {item.project_name}</div>
                {item.description && <p className="text-xs text-zinc-500 mb-2">{item.description}</p>}
                {item.link_url && (
                  <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                    <ExternalLink size={10} /> Apri link esterno
                  </a>
                )}
              </div>
              <Select value={item.status} onValueChange={v => handleStatusChange(item.id, v)}>
                <SelectTrigger className="w-28 h-8 text-xs bg-zinc-800 border-zinc-700 text-white flex-shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {['draft', 'review', 'approved', 'published'].map(s => <SelectItem key={s} value={s} className="text-white text-xs">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
