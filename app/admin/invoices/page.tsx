'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Receipt, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_id: '', invoice_number: '', amount: '', status: 'pending', due_date: '', issued_date: new Date().toISOString().split('T')[0], notes: '' });

  useEffect(() => {
    Promise.all([
      fetch('/api/invoices').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([iData, cData]) => {
      setInvoices(iData.invoices || []);
      setClients(cData.clients || []);
      setLoading(false);
    });
  }, []);

  async function handleCreate() {
    if (!form.client_id || !form.invoice_number || !form.amount || !form.due_date) { toast.error('Campi obbligatori mancanti'); return; }
    const res = await fetch('/api/invoices', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      toast.success('Fattura creata!');
      setOpen(false);
      const d = await res.json();
      setInvoices(prev => [d.invoice, ...prev]);
    } else toast.error('Errore');
  }

  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Fatture</h1>
          <p className="text-zinc-500 text-sm mt-1">{invoices.length} fatture totali</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 gap-2" onClick={() => setOpen(true)}><Plus size={16} />Nuova fattura</Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">In attesa</div>
          <div className="text-xl font-bold text-white">€{totalPending.toLocaleString('it-IT')}</div>
        </div>
        <div className="bg-zinc-900 border border-red-900/30 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Scadute</div>
          <div className="text-xl font-bold text-red-400">€{totalOverdue.toLocaleString('it-IT')}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Pagate</div>
          <div className="text-xl font-bold text-green-400">€{invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0).toLocaleString('it-IT')}</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16 text-zinc-600"><Receipt size={48} className="mx-auto mb-4 opacity-30" /><p>Nessuna fattura</p></div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800">
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-5 py-3">N. Fattura</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-5 py-3 hidden md:table-cell">Cliente</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-5 py-3">Importo</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase px-5 py-3 hidden lg:table-cell">Scadenza</th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-800">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/admin/invoices/${inv.id}`} className="font-mono font-medium text-white hover:text-red-300 transition-colors">{inv.invoice_number}</Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-400 hidden md:table-cell">{inv.client_name}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-white">€{inv.amount.toLocaleString('it-IT')}</td>
                  <td className="px-5 py-4"><StatusBadge status={inv.status} /></td>
                  <td className={`px-5 py-4 text-sm hidden lg:table-cell ${inv.status === 'overdue' ? 'text-red-400 font-medium' : 'text-zinc-500'}`}>
                    {format(new Date(inv.due_date), 'd MMM yyyy', { locale: it })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Nuova fattura</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label className="text-zinc-300 mb-1.5 block">Cliente *</Label>
              <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Seleziona cliente" /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">{clients.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-white">{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-zinc-300 mb-1.5 block">N. Fattura *</Label><Input value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" placeholder="INV-2025-003" /></div>
              <div><Label className="text-zinc-300 mb-1.5 block">Importo € *</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-zinc-300 mb-1.5 block">Data emissione *</Label><Input type="date" value={form.issued_date} onChange={e => setForm(f => ({ ...f, issued_date: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
              <div><Label className="text-zinc-300 mb-1.5 block">Scadenza *</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            </div>
            <div><Label className="text-zinc-300 mb-1.5 block">Note</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <Button onClick={handleCreate} className="w-full bg-red-600 hover:bg-red-700">Crea fattura</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
