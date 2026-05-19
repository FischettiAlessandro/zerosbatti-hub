'use client';

import { useState, useEffect } from 'react';
import { Plus, Users, Mail, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    fetch('/api/users?role=collaborator').then(r => r.json()).then(d => { setCollaborators(d.users || []); setLoading(false); });
  }, []);

  async function handleCreate() {
    if (!form.name || !form.email || !form.password) { toast.error('Tutti i campi richiesti'); return; }
    const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, role: 'collaborator' }) });
    if (res.ok) { toast.success('Collaboratore creato!'); setOpen(false); const d = await res.json(); setCollaborators(prev => [...prev, d.user]); setForm({ name: '', email: '', password: '' }); }
    else { const d = await res.json(); toast.error(d.error || 'Errore'); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Eliminare questo collaboratore?')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) { setCollaborators(prev => prev.filter(c => c.id !== id)); toast.success('Collaboratore eliminato'); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Collaboratori</h1>
          <p className="text-zinc-500 text-sm mt-1">{collaborators.length} collaboratori</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 gap-2" onClick={() => setOpen(true)}><Plus size={16} />Nuovo collaboratore</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
      ) : collaborators.length === 0 ? (
        <div className="text-center py-16 text-zinc-600"><Users size={48} className="mx-auto mb-4 opacity-30" /><p>Nessun collaboratore</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {collaborators.map(c => (
            <div key={c.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-600/20 border border-blue-600/30 rounded-full flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white">{c.name}</div>
                <div className="flex items-center gap-1 text-xs text-zinc-500 mt-1"><Mail size={10} />{c.email}</div>
                <div className={`text-xs mt-1 ${c.is_active ? 'text-green-400' : 'text-red-400'}`}>{c.is_active ? '● Attivo' : '● Disattivo'}</div>
              </div>
              <button onClick={() => handleDelete(c.id)} className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Nuovo collaboratore</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label className="text-zinc-300 mb-1.5 block">Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div><Label className="text-zinc-300 mb-1.5 block">Email *</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <div><Label className="text-zinc-300 mb-1.5 block">Password *</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" /></div>
            <Button onClick={handleCreate} className="w-full bg-red-600 hover:bg-red-700">Crea collaboratore</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
