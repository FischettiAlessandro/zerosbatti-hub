'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Building2, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Client } from '@/lib/types';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '' });

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    const res = await fetch('/api/clients');
    if (res.ok) {
      const data = await res.json();
      setClients(data.clients || []);
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.name) { toast.error('Nome richiesto'); return; }
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success('Cliente creato!');
      setOpen(false);
      setForm({ name: '', email: '', phone: '', company: '' });
      fetchClients();
    } else {
      toast.error('Errore nella creazione');
    }
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Clienti</h1>
          <p className="text-zinc-500 text-sm mt-1">{clients.length} clienti totali</p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 gap-2" onClick={() => setOpen(true)}>
          <Plus size={16} /> Nuovo cliente
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
            <DialogHeader>
              <DialogTitle>Nuovo cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {[
                { key: 'name', label: 'Nome *', placeholder: 'Es: Mario Rossi', icon: User },
                { key: 'company', label: 'Azienda', placeholder: 'Es: Rossi Srl', icon: Building2 },
                { key: 'email', label: 'Email', placeholder: 'mario@rossi.it', icon: Mail },
                { key: 'phone', label: 'Telefono', placeholder: '+39 331 000000', icon: Phone },
              ].map(field => (
                <div key={field.key}>
                  <Label className="text-zinc-300 mb-1.5 block">{field.label}</Label>
                  <Input
                    placeholder={field.placeholder}
                    value={form[field.key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    className="bg-zinc-800 border-zinc-700 text-white placeholder-zinc-600"
                  />
                </div>
              ))}
              <Button onClick={handleCreate} className="w-full bg-red-600 hover:bg-red-700">Crea cliente</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <Input
          placeholder="Cerca per nome, azienda o email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-600">
          <Building2 size={48} className="mx-auto mb-4 opacity-30" />
          <p>Nessun cliente trovato</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(client => (
            <Link key={client.id} href={`/admin/clients/${client.id}`}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-all hover:bg-zinc-800/50 cursor-pointer group">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-600/20 border border-red-600/30 rounded-full flex items-center justify-center text-red-400 font-bold text-sm flex-shrink-0">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate group-hover:text-red-300 transition-colors">{client.name}</h3>
                    {client.company && <p className="text-sm text-zinc-500 truncate">{client.company}</p>}
                  </div>
                </div>
                <div className="space-y-1.5 text-xs text-zinc-500">
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
