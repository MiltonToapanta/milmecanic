import type { ReactNode } from 'react';
import { useAuthStore } from '../../features/auth/store/auth.store';

export function PermissionGuard({ permission, children }: { permission?: string; children: ReactNode }) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  if (permission && !hasPermission(permission)) return null;
  return <>{children}</>;
}
