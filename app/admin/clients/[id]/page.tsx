'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Building2, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Client, Project } from '@/lib/types';

export default function ClientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', company: '' });
  const [projectForm, setProjectForm] = useState({ name: '', description: '', status: 'active', start_date: '' });

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then(r => r.json())
      .then(data => {
        setClient(data.client);
        setProjects(data.projects || []);
        setEditForm({ name: data.client?.name || '', email: data.client?.email || '', phone: data.client?.phone || '', company: data.client?.company || '' });
        setLoading(false);
      });
  }, [id]);

  async function handleEdit() {
    const res = await fetch(`/api/clients/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editForm) });
    if (res.ok) { toast.success('Cliente aggiornato'); setEditOpen(false); const data = await res.json(); setClient(data.client); }
    else toast.error('Errore aggiornamento');
  }

  async function handleDelete() {
    if (!confirm('Eliminare questo cliente?')) return;
    const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Cliente eliminato'); router.push('/admin/clients'); }
  }

  async function handleCreateProject() {
    const res = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...projectForm, client_id: id }) });
    if (res.ok) { toast.success('Progetto creato!'); setProjectOpen(false); const data = await res.json(); setProjects(p => [data.project, ...p]); }
    else toast.error('Errore creazione progetto');
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>;
  if (!client) return <div className="text-center py-16 text-zinc-600">Cliente non trovato</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/clients">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white"><ArrowLeft size={18} /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{client.name}</h1>
          {client.company && <p className="text-zinc-500 text-sm">{client.company}</p>}
        </div>
        <Button variant="outline" className="border-zinc-700 text-zinc-400 hover:text-white gap-2" onClick={() => setEditOpen(true)}>
          <Edit size={14} /> Modifica
        </Button>
        <Button variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-950/30" onClick={handleDelete}>
          <Trash2 size={16} />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mb-4">Informazioni</h2>
          <div className="space-y-3">
            {client.email && <div className="flex items-center gap-3 text-sm"><Mail size={14} className="text-zinc-500" /><span className="text-zinc-300">{client.email}</span></div>}
            {client.phone && <div className="flex items-center gap-3 text-sm"><Phone size={14} className="text-zinc-500" /><span className="text-zinc-300">{client.phone}</span></div>}
            {client.company && <div className="flex items-center gap-3 text-sm"><Building2 size={14} className="text-zinc-500" /><span className="text-zinc-300">{client.company}</span></div>}
          </div>
        </div>
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Progetti ({projects.length})</h2>
            <Button size="sm" className="bg-red-600 hover:bg-red-700 gap-1.5" onClick={() => setProjectOpen(true)}>
              <Plus size={14} /> Nuovo progetto
            </Button>
          </div>
          <div className="space-y-2">
            {projects.length === 0 ? <p className="text-sm text-zinc-600">Nessun progetto</p> : projects.map(p => (
              <Link key={p.id} href={`/admin/projects/${p.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{p.name}</div>
                    {p.description && <div className="text-xs text-zinc-500 truncate">{p.description}</div>}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Edit client dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Modifica cliente</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            {[{ key: 'name', label: 'Nome *' }, { key: 'company', label: 'Azienda' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Telefono' }].map(f => (
              <div key={f.key}>
                <Label className="text-zinc-300 mb-1.5 block">{f.label}</Label>
                <Input value={editForm[f.key as keyof typeof editForm]} onChange={e => setEditForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" />
              </div>
            ))}
            <Button onClick={handleEdit} className="w-full bg-red-600 hover:bg-red-700">Salva modifiche</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create project dialog */}
      <Dialog open={projectOpen} onOpenChange={setProjectOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Nuovo progetto</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-zinc-300 mb-1.5 block">Nome *</Label>
              <Input value={projectForm.name} onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" placeholder="Social Media Q1 2025" />
            </div>
            <div>
              <Label className="text-zinc-300 mb-1.5 block">Descrizione</Label>
              <Textarea value={projectForm.description} onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" rows={3} />
            </div>
            <div>
              <Label className="text-zinc-300 mb-1.5 block">Status</Label>
              <Select value={projectForm.status} onValueChange={v => setProjectForm(f => ({ ...f, status: v as string }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {['active', 'paused', 'completed', 'cancelled'].map(s => <SelectItem key={s} value={s} className="text-white">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-300 mb-1.5 block">Data inizio</Label>
              <Input type="date" value={projectForm.start_date} onChange={e => setProjectForm(f => ({ ...f, start_date: e.target.value }))} className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <Button onClick={handleCreateProject} className="w-full bg-red-600 hover:bg-red-700">Crea progetto</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
