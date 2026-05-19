'use client';

import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminSettings() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">Impostazioni</h1>
      <div className="bg-zinc-900 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Profilo</h2>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-medium text-white">
              {user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="ml-4">
              <p className="text-white font-medium">{user?.name}</p>
              <p className="text-zinc-400 text-sm">{user?.email}</p>
              <p className="text-zinc-500 text-sm">Ruolo: {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-8">
        <Button 
          variant="destructive"
          onClick={handleLogout}
          className="w-full"
        >
          <LogOut className="mr-2" /> Logout
        </Button>
      </div>
    </div>
  );
}