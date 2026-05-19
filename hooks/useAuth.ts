'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export function useAuth() {
  const { user, permissions, isLoading, setUser, setPermissions, setLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    async function fetchMe() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setPermissions(data.permissions || {});
        } else {
          setUser(null);
          router.push('/login');
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    if (!user) fetchMe();
    else setLoading(false);
  }, []);

  return { user, permissions, isLoading };
}

export async function logout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  useAuthStore.getState().logout();
  window.location.href = '/login';
}
