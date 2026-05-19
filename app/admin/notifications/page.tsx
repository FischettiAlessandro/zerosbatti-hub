'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, string> = { task: '✅', content: '📄', invoice: '💰', quote: '📋', comment: '💬', system: '🔔' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications').then(r => r.json()).then(d => { setNotifications(d.notifications || []); setLoading(false); });
  }, []);

  async function markRead(id: number) {
    await fetch(`/api/notifications/${id}`, { method: 'PUT' });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  }

  async function deleteNotif(id: number) {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifiche</h1>
          <p className="text-zinc-500 text-sm mt-1">{notifications.filter(n => !n.is_read).length} non lette</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} className="border-zinc-700 text-zinc-400 hover:text-white gap-2">
          <Check size={14} />Segna tutte come lette
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 text-zinc-600"><Bell size={48} className="mx-auto mb-4 opacity-30" /><p>Nessuna notifica</p></div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <div key={n.id} className={cn('bg-zinc-900 border rounded-xl p-4 flex items-start gap-4 transition-all', !n.is_read ? 'border-zinc-700 bg-zinc-900' : 'border-zinc-800 opacity-60')}>
              <div className="text-xl flex-shrink-0">{typeIcons[n.type] || '🔔'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {!n.is_read && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />}
                  <span className="font-medium text-white">{n.title}</span>
                </div>
                <p className="text-sm text-zinc-400">{n.message}</p>
                <p className="text-xs text-zinc-600 mt-1">{format(new Date(n.created_at), 'd MMM yyyy, HH:mm', { locale: it })}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {!n.is_read && (
                  <button onClick={() => markRead(n.id)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-green-400 transition-colors">
                    <Check size={14} />
                  </button>
                )}
                <button onClick={() => deleteNotif(n.id)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
