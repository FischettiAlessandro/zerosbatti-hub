'use client';

import { useState } from 'react';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminCalendarPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_datetime: '', end_datetime: '', event_type: 'content' });
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleCreate() {
    if (!form.title || !form.start_datetime || !form.end_datetime) { toast.error('Campi obbligatori mancanti'); return; }
    const res = await fetch('/api/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { toast.success('Evento aggiunto!'); setAddOpen(false); setRefreshKey(k => k + 1); setForm({ title: '', description: '', start_datetime: '', end_datetime: '', event_type: 'content' }); }
    else toast.error('Errore');
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Calendario Editoriale</h1>
        <p className="text-zinc-500 text-sm mt-1">Vista globale di tutti gli eventi e contenuti pianificati</p>
      </div>

      <CalendarView key={refreshKey} canEdit onAddEvent={() => setAddOpen(true)} />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Nuovo evento</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label className="text-zinc-300 mb-1.5 block">Titolo *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div><Label className="text-zinc-300 mb-1.5 block">Tipo</Label>
              <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v as string }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">{['content', 'task', 'meeting', 'deadline', 'campaign'].map(t => <SelectItem key={t} value={t} className="text-white">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-zinc-300 mb-1.5 block">Inizio *</Label><Input type="datetime-local" value={form.start_datetime} onChange={e => setForm(f => ({ ...f, start_datetime: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div><Label className="text-zinc-300 mb-1.5 block">Fine *</Label><Input type="datetime-local" value={form.end_datetime} onChange={e => setForm(f => ({ ...f, end_datetime: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div><Label className="text-zinc-300 mb-1.5 block">Note</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" rows={2} /></div>
            <Button onClick={handleCreate} className="w-full bg-red-600 hover:bg-red-700">Crea evento</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
