'use client';

import { useState, useEffect } from 'react';
import { Receipt } from 'lucide-react';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/invoices').then(r => r.json()).then(d => { setInvoices(d.invoices || []); setLoading(false); });
  }, []);

  const paid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Le mie Fatture</h1>
        <p className="text-zinc-500 text-sm mt-1">Storico completo delle fatture</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Pagate</div>
          <div className="text-xl font-bold text-green-400">€{paid.toLocaleString('it-IT')}</div>
        </div>
        <div className={`bg-zinc-900 border rounded-xl p-4 text-center ${pending > 0 ? 'border-yellow-700/30' : 'border-zinc-800'}`}>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Da pagare</div>
          <div className={`text-xl font-bold ${pending > 0 ? 'text-yellow-400' : 'text-zinc-600'}`}>€{pending.toLocaleString('it-IT')}</div>
        </div>
        <div className={`bg-zinc-900 border rounded-xl p-4 text-center ${overdue > 0 ? 'border-red-700/30 bg-red-950/10' : 'border-zinc-800'}`}>
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Scadute</div>
          <div className={`text-xl font-bold ${overdue > 0 ? 'text-red-400' : 'text-zinc-600'}`}>€{overdue.toLocaleString('it-IT')}</div>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
        : invoices.length === 0 ? <div className="text-center py-16 text-zinc-600"><Receipt size={48} className="mx-auto mb-4 opacity-30" /><p>Nessuna fattura</p></div>
        : <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800">
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-5 py-3">N. Fattura</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-5 py-3">Importo</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-5 py-3 hidden md:table-cell">Emessa</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-5 py-3 hidden md:table-cell">Scadenza</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-800">
              {invoices.map(inv => (
                <tr key={inv.id} className={`transition-colors ${inv.status === 'overdue' ? 'bg-red-950/10' : 'hover:bg-zinc-800/30'}`}>
                  <td className="px-5 py-4 font-mono text-sm text-white">{inv.invoice_number}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-white">€{inv.amount.toLocaleString('it-IT')}</td>
                  <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                  <td className="px-5 py-4 text-sm text-zinc-500 hidden md:table-cell">{format(new Date(inv.issued_date), 'd MMM yyyy', { locale: it })}</td>
                  <td className={`px-5 py-4 text-sm hidden md:table-cell ${inv.status === 'overdue' ? 'text-red-400 font-medium' : 'text-zinc-500'}`}>
                    {format(new Date(inv.due_date), 'd MMM yyyy', { locale: it })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}
