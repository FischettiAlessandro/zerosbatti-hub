'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, FolderOpen, CheckSquare, FileText,
  Calendar, Receipt, FileCheck, Bell, Shield,
  Briefcase, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const adminNav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/clients', label: 'Clienti', icon: Users },
  { href: '/admin/projects', label: 'Progetti', icon: FolderOpen },
  { href: '/admin/tasks', label: 'Task', icon: CheckSquare },
  { href: '/admin/content', label: 'Contenuti', icon: FileText },
  { href: '/admin/calendar', label: 'Calendario', icon: Calendar },
  { href: '/admin/quotes', label: 'Preventivi', icon: FileCheck },
  { href: '/admin/invoices', label: 'Fatture', icon: Receipt },
  { href: '/admin/collaborators', label: 'Collaboratori', icon: Briefcase },
  { href: '/admin/permissions', label: 'Permessi', icon: Shield },
  { href: '/admin/notifications', label: 'Notifiche', icon: Bell },
];

const collaboratorNav = [
  { href: '/collaborator', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/collaborator/projects', label: 'Progetti', icon: FolderOpen },
  { href: '/collaborator/tasks', label: 'I miei Task', icon: CheckSquare },
  { href: '/collaborator/content', label: 'Contenuti', icon: FileText },
  { href: '/collaborator/calendar', label: 'Calendario', icon: Calendar },
  { href: '/collaborator/notifications', label: 'Notifiche', icon: Bell },
];

const clientNav = [
  { href: '/client', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/client/project', label: 'Il mio Progetto', icon: FolderOpen },
  { href: '/client/content', label: 'Contenuti', icon: FileText },
  { href: '/client/calendar', label: 'Calendario', icon: Calendar },
  { href: '/client/quotes', label: 'Preventivi', icon: FileCheck },
  { href: '/client/invoices', label: 'Fatture', icon: Receipt },
  { href: '/client/notifications', label: 'Notifiche', icon: Bell },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, hasModule } = useAuthStore();
  const pathname = usePathname();

  const moduleMap: Record<string, string> = {
    '/client/calendar': 'calendar',
    '/client/content': 'content',
    '/client/quotes': 'quotes',
    '/client/invoices': 'invoices',
    '/collaborator/calendar': 'calendar',
    '/collaborator/content': 'content',
    '/collaborator/tasks': 'tasks',
  };

  const navItems = user?.role === 'admin' ? adminNav
    : user?.role === 'collaborator' ? collaboratorNav
    : clientNav;

  const filteredNav = navItems.filter(item => {
    const moduleName = moduleMap[item.href];
    if (moduleName) return hasModule(moduleName);
    return true;
  });

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-16 left-0 bottom-0 z-40 w-64 bg-zinc-950 border-r border-zinc-800 flex flex-col transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => onClose()}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                      isActive
                        ? 'bg-red-600/20 text-red-400 border border-red-600/30'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    )}
                  >
                    <Icon size={18} className={cn(isActive ? 'text-red-400' : 'text-zinc-500 group-hover:text-zinc-300')} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight size={14} className="text-red-400" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="px-3 py-2 rounded-lg bg-zinc-900">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
              {user?.role === 'admin' ? '⚡ Admin' : user?.role === 'collaborator' ? '👥 Collaboratore' : '🏢 Cliente'}
            </div>
            <div className="text-xs text-zinc-400 truncate">{user?.email}</div>
          </div>
        </div>
      </aside>
    </>
  );
}
