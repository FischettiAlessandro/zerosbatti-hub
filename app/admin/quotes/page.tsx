'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, FileCheck, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface QuoteItem { description: string; quantity: number; unit_price: number; }

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ client_id: '', title: '', description: '', status: 'draft', valid_until: '' });
  const [items, setItems] = useState<QuoteItem[]>([{ description: '', quantity: 1, unit_price: 0 }]);

  useEffect(() => {
    Promise.all([
      fetch('/api/quotes').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([qData, cData]) => {
      setQuotes(qData.quotes || []);
      setClients(cData.clients || []);
      setLoading(false);
    });
  }, []);

  function addItem() { setItems(i => [...i, { description: '', quantity: 1, unit_price: 0 }]); }
  function removeItem(idx: number) { setItems(i => i.filter((_, j) => j !== idx)); }
  function updateItem(idx: number, field: keyof QuoteItem, value: any) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: field === 'description' ? value : Number(value) } : item));
  }
  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  async function handleCreate() {
    if (!form.client_id || !form.title) { toast.error('Cliente e titolo richiesti'); return; }
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, items, total_amount: total }),
    });
    if (res.ok) {
      toast.success('Preventivo creato!');
      setOpen(false);
      const d = await res.json();
      setQuotes(prev => [d.quote, ...prev]);
      setForm({ client_id: '', title: '', description: '', status: 'draft', valid_until: '' });
      setItems([{ description: '', quantity: 1, unit_price: 0 }]);
    } else toast.error('Errore');
  }

  async function handleDelete(id: number) {
    if (!confirm('Eliminare questo preventivo?')) return;
    const res = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
    if (res.ok) { setQuotes(prev => prev.filter(q => q.id !== id)); toast.success('Preventivo eliminato'); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Preventivi</h1>
          <p className="text-zinc-500 text-sm mt-1">{quotes.length} preventivi totali</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 gap-2" onClick={() => setOpen(true)}><Plus size={16} />Nuovo preventivo</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-16 text-zinc-600"><FileCheck size={48} className="mx-auto mb-4 opacity-30" /><p>Nessun preventivo</p></div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-zinc-800">
              <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">Titolo</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">Cliente</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">Importo</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Scadenza</th>
              <th className="px-5 py-3"></th>
            </tr></thead>
            <tbody className="divide-y divide-zinc-800">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/admin/quotes/${q.id}`} className="font-medium text-white hover:text-red-300 transition-colors">{q.title}</Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-zinc-400 hidden md:table-cell">{q.client_name}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-white">€{q.total_amount.toLocaleString('it-IT')}</td>
                  <td className="px-5 py-4"><StatusBadge status={q.status} /></td>
                  <td className="px-5 py-4 text-sm text-zinc-500 hidden lg:table-cell">
                    {q.valid_until ? format(new Date(q.valid_until), 'd MMM yyyy', { locale: it }) : '—'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => handleDelete(q.id)} className="text-zinc-600 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuovo preventivo</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label className="text-zinc-300 mb-1.5 block">Cliente *</Label>
              <Select value={form.client_id} onValueChange={v => setForm(f => ({ ...f, client_id: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue placeholder="Seleziona cliente" /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">{clients.map(c => <SelectItem key={c.id} value={String(c.id)} className="text-white">{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-zinc-300 mb-1.5 block">Titolo *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div><Label className="text-zinc-300 mb-1.5 block">Descrizione</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" rows={2} /></div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-zinc-300">Voci preventivo</Label>
                <Button type="button" size="sm" variant="outline" onClick={addItem} className="border-zinc-700 text-zinc-400 hover:text-white h-7 text-xs gap-1"><Plus size={12} />Aggiungi</Button>
              </div>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <Input placeholder="Descrizione servizio" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="bg-zinc-800 border-zinc-700 text-white text-sm flex-1" />
                    <Input type="number" placeholder="Qtà" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="bg-zinc-800 border-zinc-700 text-white text-sm w-16" min={1} />
                    <Input type="number" placeholder="€ unitario" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', e.target.value)} className="bg-zinc-800 border-zinc-700 text-white text-sm w-24" />
                    <span className="text-sm text-zinc-400 pt-2 w-20 text-right">€{(item.quantity * item.unit_price).toLocaleString()}</span>
                    {items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-zinc-600 hover:text-red-400 pt-2"><Trash2 size={14} /></button>}
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-3 pt-3 border-t border-zinc-800">
                <div className="text-right">
                  <div className="text-xs text-zinc-500">Totale</div>
                  <div className="text-xl font-bold text-white">€{total.toLocaleString('it-IT')}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-zinc-300 mb-1.5 block">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">{['draft', 'sent'].map(s => <SelectItem key={s} value={s} className="text-white">{s === 'draft' ? 'Bozza' : 'Invia subito'}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-zinc-300 mb-1.5 block">Valido fino al</Label><Input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            </div>
            <Button onClick={handleCreate} className="w-full bg-red-600 hover:bg-red-700">Crea preventivo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
