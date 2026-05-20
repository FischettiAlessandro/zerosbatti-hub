'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Quote } from '@/lib/types';

interface QuoteItem { description: string; quantity: number; unit_price: number; total?: number; }

export default function ClientQuoteDetailPage() {
  const { id } = useParams();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetch(`/api/quotes/${id}`).then(r => r.json()).then(d => { setQuote(d.quote); setLoading(false); });
  }, [id]);

  async function handleResponse(status: 'accepted' | 'rejected') {
    setActing(true);
    const res = await fetch(`/api/quotes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (res.ok) {
      toast.success(status === 'accepted' ? '✅ Preventivo accettato! Il team è stato notificato.' : '❌ Preventivo rifiutato.');
      const d = await res.json();
      setQuote(d.quote);
    }
    setActing(false);
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>;
  if (!quote) return <div className="text-center py-16 text-zinc-600">Preventivo non trovato</div>;

  const items = quote.items_json ? JSON.parse(quote.items_json) : [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/client/quotes"><Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white"><ArrowLeft size={18} /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{quote.title}</h1>
          <p className="text-zinc-500 text-sm">{format(new Date(quote.created_at), 'd MMMM yyyy', { locale: it })}</p>
        </div>
        <StatusBadge status={quote.status} />
      </div>

      {/* CTA for pending quotes */}
      {quote.status === 'sent' && (
        <div className="bg-red-950/20 border border-red-600/30 rounded-xl p-5 mb-6">
          <h2 className="font-semibold text-white mb-2">⚡ Questo preventivo è in attesa della tua risposta</h2>
          <p className="text-sm text-zinc-400 mb-4">Puoi accettare o rifiutare questa proposta. In caso di accettazione, il team verrà immediatamente notificato e si metterà in contatto con te.</p>
          <div className="flex gap-3">
            <Button onClick={() => handleResponse('accepted')} disabled={acting} className="bg-green-700 hover:bg-green-600 gap-2 flex-1">
              <Check size={16} />Accetta preventivo
            </Button>
            <Button onClick={() => handleResponse('rejected')} disabled={acting} variant="outline" className="border-red-700 text-red-400 hover:bg-red-950/30 hover:text-red-300 gap-2 flex-1">
              <X size={16} />Rifiuta
            </Button>
          </div>
        </div>
      )}

      {quote.status === 'accepted' && (
        <div className="bg-green-950/20 border border-green-700/30 rounded-xl p-4 mb-6">
          <p className="text-green-400 font-medium">✅ Hai accettato questo preventivo. Il team ZeroSbatti Social ti contatterà a breve.</p>
        </div>
      )}

      {quote.status === 'rejected' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <p className="text-zinc-400">❌ Hai rifiutato questo preventivo.</p>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h2 className="font-semibold text-white mb-4">Dettaglio offerta</h2>
        {items.length === 0 ? <p className="text-sm text-zinc-600">Nessuna voce</p> : (
          <div>
            <div className="grid grid-cols-12 text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 px-3">
              <span className="col-span-6">Servizio</span>
              <span className="col-span-2 text-center">Qtà</span>
              <span className="col-span-2 text-right">Prezzo</span>
              <span className="col-span-2 text-right">Totale</span>
            </div>
            <div className="space-y-1">
              {items.map((item: QuoteItem, idx: number) => (
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
                <div className="text-sm text-zinc-500">Totale offerta</div>
                <div className="text-3xl font-bold text-white">€{quote.total_amount.toLocaleString('it-IT')}</div>
                {quote.valid_until && <div className="text-xs text-zinc-500 mt-1">Valido fino al {format(new Date(quote.valid_until), 'd MMMM yyyy', { locale: it })}</div>}
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
    </div>
  );
}
