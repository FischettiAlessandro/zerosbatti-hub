'use client';

import { useState, useEffect } from 'react';
import { Shield, Info } from 'lucide-react';
import { toast } from 'sonner';
import { User, ModulePermission } from '@/lib/types';

type UserWithPermissions = User & { permissions: ModulePermission[] };

const MODULES = [
  { key: 'calendar', label: 'Calendario', description: 'Accesso al calendario editoriale' },
  { key: 'content', label: 'Contenuti', description: 'Visualizzazione libreria contenuti' },
  { key: 'quotes', label: 'Preventivi', description: 'Accesso ai preventivi' },
  { key: 'invoices', label: 'Fatture', description: 'Visualizzazione fatture' },
  { key: 'tasks', label: 'Task', description: 'Accesso ai task assegnati' },
  { key: 'comments', label: 'Commenti', description: 'Sistema di commenti' },
  { key: 'payments', label: 'Pagamenti', description: 'Visibilità stato pagamenti' },
];

export default function PermissionsPage() {
  const [users, setUsers] = useState<UserWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/permissions').then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false); });
  }, []);

  function getPermission(user: UserWithPermissions, module: string): boolean {
    const perm = user.permissions?.find((p) => p.module_name === module);
    return perm ? perm.is_visible === 1 : true; // default visible
  }

  async function togglePermission(userId: number, module: string, currentValue: boolean) {
    const key = `${userId}-${module}`;
    setSaving(key);
    const res = await fetch('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, module_name: module, is_visible: !currentValue }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => {
        if (u.id !== userId) return u;
        const newPerms = u.permissions.filter((p) => p.module_name !== module);
        newPerms.push({ module_name: module, is_visible: !currentValue ? 1 : 0 });
        return { ...u, permissions: newPerms };
      }));
      toast.success('Permesso aggiornato');
    }
    setSaving(null);
  }

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Permessi Modulari</h1>
        <p className="text-zinc-500 text-sm mt-1">Controlla la visibilità di sezioni per ogni utente</p>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-zinc-400">
          Gli admin hanno sempre accesso completo. I permessi qui sotto si applicano a collaboratori e clienti.
          Il toggle <span className="text-green-400 font-medium">verde = visibile</span>, <span className="text-zinc-500 font-medium">grigio = nascosto</span>.
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-16 text-zinc-600"><Shield size={48} className="mx-auto mb-4 opacity-30" /><p>Nessun utente da configurare</p></div>
      ) : (
        <div className="space-y-6">
          {users.map(user => (
            <div key={user.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-zinc-800">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${user.role === 'collaborator' ? 'bg-blue-600/20 border border-blue-600/30 text-blue-400' : 'bg-zinc-700 text-zinc-400'}`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-white">{user.name}</div>
                  <div className="text-xs text-zinc-500">{user.email} · {user.role === 'collaborator' ? 'Collaboratore' : 'Cliente'}</div>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {MODULES.map(mod => {
                    const isVisible = getPermission(user, mod.key);
                    const isSaving = saving === `${user.id}-${mod.key}`;
                    return (
                      <button
                        key={mod.key}
                        onClick={() => togglePermission(user.id, mod.key, isVisible)}
                        disabled={isSaving}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all text-left ${isVisible ? 'bg-green-950/30 border-green-700/30' : 'bg-zinc-800/50 border-zinc-700/50'}`}
                      >
                        <div>
                          <div className={`text-sm font-medium ${isVisible ? 'text-green-400' : 'text-zinc-500'}`}>{mod.label}</div>
                          <div className="text-xs text-zinc-600 mt-0.5">{mod.description}</div>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors flex-shrink-0 ml-2 ${isVisible ? 'bg-green-600' : 'bg-zinc-700'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isVisible ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
