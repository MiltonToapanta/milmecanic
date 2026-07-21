import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { QueryProvider } from './QueryProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshAccessToken = useAuthStore((state) => state.refreshAccessToken);
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser);

  useEffect(() => {
    if (!refreshToken) return;
    const restore = async () => {
      const token = accessToken ?? (await refreshAccessToken());
      if (token) await loadCurrentUser();
    };
    void restore();
  }, [accessToken, loadCurrentUser, refreshAccessToken, refreshToken]);

  return (
    <QueryProvider>
      {children}
      <Toaster richColors position="top-right" />
    </QueryProvider>
  );
}
