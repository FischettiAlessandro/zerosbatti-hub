'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, setPermissions, setLoading } = useAuthStore();

  useEffect(() => {
    if (!user) {
      fetch('/api/auth/me')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setUser(data.user);
            setPermissions(data.permissions || {});
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  return <>{children}</>;
}
