import { create } from 'zustand';
import { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  permissions: Record<string, boolean>;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setPermissions: (permissions: Record<string, boolean>) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  hasModule: (module: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  permissions: {},
  isLoading: true,
  setUser: (user) => set({ user }),
  setPermissions: (permissions) => set({ permissions }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, permissions: {} }),
  hasModule: (module) => {
    const { permissions, user } = get();
    if (user?.role === 'admin') return true;
    if (module in permissions) return permissions[module];
    return true; // default visible
  },
}));
