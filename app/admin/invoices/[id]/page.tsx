'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Invoice, Payment } from '@/lib/types';

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetch(`/api/invoices/${id}`).then(r => r.json()).then(d => {
      setInvoice(d.invoice); setPayments(d.payments || []); setLoading(false);
    });
  }, [id]);

  async function handleStatusChange(status: string) {
    const res = await fetch(`/api/invoices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...invoice, status, ...(status === 'paid' ? { payment_date: payDate } : {}) }) });
    if (res.ok) { const d = await res.json(); setInvoice(d.invoice); toast.success('Fattura aggiornata'); if (status === 'paid') { fetch(`/api/invoices/${id}`).then(r => r.json()).then(d => setPayments(d.payments || [])); } }
  }

  async function handleReminder() {
    const res = await fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: invoice.client_id, title: 'Sollecito pagamento', message: `Fattura ${invoice.invoice_number} di €${invoice.amount} in scadenza`, type: 'invoice' })
    });
    if (res.ok) toast.success('Sollecito inviato internamente!');
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>;
  if (!invoice) return <div className="text-center py-16 text-zinc-600">Fattura non trovata</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/invoices"><Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white"><ArrowLeft size={18} /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white font-mono">{invoice.invoice_number}</h1>
          <p className="text-zinc-500 text-sm">{invoice.client_name}</p>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Dettagli fattura</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-zinc-500 block mb-1">Cliente</span><span className="text-white">{invoice.client_name}</span></div>
              <div><span className="text-zinc-500 block mb-1">Importo</span><span className="text-2xl font-bold text-white">€{invoice.amount.toLocaleString('it-IT')}</span></div>
              <div><span className="text-zinc-500 block mb-1">Emessa il</span><span className="text-white">{format(new Date(invoice.issued_date), 'd MMMM yyyy', { locale: it })}</span></div>
              <div><span className="text-zinc-500 block mb-1">Scadenza</span><span className={invoice.status === 'overdue' ? 'text-red-400 font-medium' : 'text-white'}>{format(new Date(invoice.due_date), 'd MMMM yyyy', { locale: it })}</span></div>
              {invoice.notes && <div className="col-span-2"><span className="text-zinc-500 block mb-1">Note</span><span className="text-zinc-400">{invoice.notes}</span></div>}
            </div>
          </div>

          {payments.length > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <h2 className="font-semibold text-white mb-4">Storico pagamenti</h2>
              <div className="space-y-2">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg text-sm">
                    <div>
                      <span className="text-white font-medium">€{p.amount_paid.toLocaleString('it-IT')}</span>
                      {p.method && <span className="text-zinc-500 ml-2">via {p.method}</span>}
                    </div>
                    <span className="text-zinc-500">{format(new Date(p.payment_date), 'd MMM yyyy', { locale: it })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <h2 className="font-semibold text-white mb-4">Azioni</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-zinc-400 text-xs mb-1.5 block">Cambia status</Label>
                <Select value={invoice.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {['pending', 'paid', 'overdue'].map(s => <SelectItem key={s} value={s} className="text-white">{s === 'pending' ? 'In attesa' : s === 'paid' ? 'Pagata' : 'Scaduta'}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {invoice.status !== 'paid' && (
                <div>
                  <Label className="text-zinc-400 text-xs mb-1.5 block">Data pagamento</Label>
                  <Input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} className="bg-zinc-800 border-zinc-700 text-white text-sm" />
                  <Button onClick={() => handleStatusChange('paid')} className="w-full mt-2 bg-green-700 hover:bg-green-600 text-sm">✓ Segna come pagata</Button>
                </div>
              )}
              {invoice.status !== 'paid' && (
                <Button onClick={handleReminder} variant="outline" className="w-full border-zinc-700 text-zinc-400 hover:text-white gap-2">
                  <Bell size={14} />Invia sollecito interno
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
