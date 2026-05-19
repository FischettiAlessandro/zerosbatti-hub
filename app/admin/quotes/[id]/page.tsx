'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function QuoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/quotes/${id}`).then(r => r.json()).then(d => { setQuote(d.quote); setLoading(false); });
  }, [id]);

  async function handleStatusChange(status: string) {
    const items = quote?.items_json ? JSON.parse(quote.items_json) : [];
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...quote, items, status }),
    });
    if (res.ok) { const d = await res.json(); setQuote(d.quote); toast.success('Status aggiornato'); }
    else toast.error('Errore');
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>;
  if (!quote) return <div className="text-center py-16 text-zinc-600">Preventivo non trovato</div>;

  const items = quote.items_json ? JSON.parse(quote.items_json) : [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/quotes"><Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white"><ArrowLeft size={18} /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{quote.title}</h1>
          <p className="text-zinc-500 text-sm">{quote.client_name}</p>
        </div>
        <StatusBadge status={quote.status} />
        <Select value={quote.status} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700 text-white text-sm"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-zinc-800 border-zinc-700">
            {['draft', 'sent', 'accepted', 'rejected', 'expired'].map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Voci preventivo</h2>
          {items.length === 0 ? (
            <p className="text-sm text-zinc-600">Nessuna voce</p>
          ) : (
            <div>
              <div className="grid grid-cols-12 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-3">
                <span className="col-span-6">Descrizione</span>
                <span className="col-span-2 text-center">Qtà</span>
                <span className="col-span-2 text-right">Prezzo</span>
                <span className="col-span-2 text-right">Totale</span>
              </div>
              <div className="space-y-1">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 text-sm p-3 rounded-lg bg-zinc-800/50">
                    <span className="col-span-6 text-white">{item.description}</span>
                    <span className="col-span-2 text-center text-zinc-400">{item.quantity}</span>
                    <span className="col-span-2 text-right text-zinc-400">€{item.unit_price.toLocaleString()}</span>
                    <span className="col-span-2 text-right font-medium text-white">€{(item.quantity * item.unit_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-4 pt-4 border-t border-zinc-800">
                <div className="text-right">
                  <div className="text-sm text-zinc-500">Totale preventivo</div>
                  <div className="text-2xl font-bold text-white">€{quote.total_amount.toLocaleString('it-IT')}</div>
                </div>
              </div>
            </div>
          )}
          {quote.description && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-500 mb-2">Note</h3>
              <p className="text-sm text-zinc-400">{quote.description}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-3">Dettagli</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-zinc-500">Cliente</span><span className="text-white">{quote.client_name}</span></div>
              <div className="flex justify-between"><span className="text-zinc-500">Stato</span><StatusBadge status={quote.status} /></div>
              <div className="flex justify-between"><span className="text-zinc-500">Creato il</span><span className="text-zinc-400">{format(new Date(quote.created_at), 'd MMM yyyy', { locale: it })}</span></div>
              {quote.valid_until && <div className="flex justify-between"><span className="text-zinc-500">Valido fino al</span><span className="text-zinc-400">{format(new Date(quote.valid_until), 'd MMM yyyy', { locale: it })}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
