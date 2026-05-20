import { getAuthUser } from '@/lib/auth';
import getDb from '@/lib/db';
import Link from 'next/link';
import { Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AdminNotificationsPage() {
  const user = await getAuthUser();
  if (!user) {
    // This should not happen if protected by middleware, but just in case
    return <div>Redirecting to login...</div>;
  }

  const db = getDb();
  const notifications = db.prepare(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC`
  ).all(user.userId);

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Notifiche</h1>
        <Link href="/admin" className="text-zinc-400 hover:text-white">
          ← Torna al cruscotto
        </Link>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <Bell className="h-10 w-10 mx-auto mb-4 text-zinc-600" />
          <p className="text-zinc-400">Nessuna notifica</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((n: any) => (
            <div key={n.id} className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="font-semibold text-white">{n.title}</h2>
                  <p className="text-zinc-400">{n.message}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
                {n.is_read === 0 && (
                  <span className="w-2 h-2 bg-red-500 rounded-full ml-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}