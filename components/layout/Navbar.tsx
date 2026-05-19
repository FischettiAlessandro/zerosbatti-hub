'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Menu, X, LogOut, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: number;
  created_at: string;
}

interface NavbarProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export function Navbar({ onMenuToggle, sidebarOpen }: NavbarProps) {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        // If not authenticated, clear notifications
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      // Handle JSON parse errors or network issues
      console.warn("Failed to fetch notifications:", error);
      setNotifications([]);
      setUnreadCount(0);
    }
  }

  async function markAllRead() {
    await fetch('/api/notifications/read-all', { method: 'POST' });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  const roleLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'collaborator' ? 'Collaboratore' : 'Cliente';
  const roleColor = user?.role === 'admin' ? 'bg-red-600' : user?.role === 'collaborator' ? 'bg-zinc-600' : 'bg-zinc-700';

  return (
    <nav className="h-16 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <Link href={`/${user?.role || ''}`} className="flex items-center gap-2">
          <Image
            src="https://www.zerosbattisocial.it/wp-content/uploads/2025/09/ZeroSbatti-Social.png"
            alt="ZeroSbatti Social"
            width={120}
            height={32}
            className="h-8 w-auto object-contain"
            unoptimized
          />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="relative text-zinc-400 hover:text-white hover:bg-zinc-800">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-zinc-900 border-zinc-800">
            <DropdownMenuLabel className="flex items-center justify-between text-white">
              <span>Notifiche</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs text-zinc-400 hover:text-red-400">
                  Segna tutte come lette
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center text-zinc-500 text-sm">Nessuna notifica</div>
              ) : (
                notifications.slice(0, 8).map(n => (
                  <DropdownMenuItem key={n.id} className={`flex flex-col items-start p-3 cursor-pointer ${n.is_read ? 'opacity-60' : 'bg-zinc-800/50'}`}>
                    <div className="flex items-center gap-2 w-full">
                      {!n.is_read && <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />}
                      <span className="font-medium text-sm text-white truncate">{n.title}</span>
                    </div>
                    <span className="text-xs text-zinc-400 mt-1 leading-relaxed">{n.message}</span>
                  </DropdownMenuItem>
                ))
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" className="flex items-center gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800 px-3">
              <div className={`w-7 h-7 rounded-full ${roleColor} flex items-center justify-center text-white text-xs font-bold`}>
                {(user?.name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '')}
              </div>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-sm font-medium text-white leading-none">{user?.name}</span>
                <span className="text-xs text-zinc-500 leading-none mt-0.5">{roleLabel}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
            <DropdownMenuLabel className="text-zinc-400">
              <div className="text-white font-medium">{user?.name}</div>
              <div className="text-xs text-zinc-500">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-zinc-800" />
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300 cursor-pointer">
              <LogOut size={16} className="mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
