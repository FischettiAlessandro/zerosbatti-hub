'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileCheck } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function ClientQuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/quotes').then(r => r.json()).then(d => { setQuotes(d.quotes || []); setLoading(false); });
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">I miei Preventivi</h1>
        <p className="text-zinc-500 text-sm mt-1">{quotes.filter(q => q.status === 'sent').length} da approvare</p>
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
        : quotes.length === 0 ? <div className="text-center py-16 text-zinc-600"><FileCheck size={48} className="mx-auto mb-4 opacity-30" /><p>Nessun preventivo</p></div>
        : <div className="space-y-4">
          {quotes.map(q => (
            <Link key={q.id} href={`/client/quotes/${q.id}`}>
              <div className={`bg-zinc-900 border rounded-xl p-5 hover:border-zinc-600 transition-all cursor-pointer ${q.status === 'sent' ? 'border-red-600/30 bg-red-950/10' : 'border-zinc-800'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{q.title}</h3>
                    {q.description && <p className="text-sm text-zinc-500 mt-1">{q.description}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={q.status} />
                    {q.status === 'sent' && <span className="text-xs text-red-400 font-medium animate-pulse">⚡ Azione richiesta</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-white">€{q.total_amount.toLocaleString('it-IT')}</span>
                  <div className="text-right text-xs text-zinc-500">
                    {q.valid_until && <div>Valido fino al {format(new Date(q.valid_until), 'd MMM yyyy', { locale: it })}</div>}
                    <div>{format(new Date(q.created_at), 'd MMM yyyy', { locale: it })}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      }
    </div>
  );
}
