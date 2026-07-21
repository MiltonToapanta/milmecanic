import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { LoadingState } from '../feedback/LoadingState';

export function ProtectedRoute({ permission }: { permission?: string }) {
  const user = useAuthStore((state) => state.user);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated || Boolean(state.refreshToken));
  const hasPermission = useAuthStore((state) => state.hasPermission);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (refreshToken && !user) {
    return (
      <div className="p-6">
        <LoadingState />
      </div>
    );
  }
  if (permission && !hasPermission(permission)) return <Navigate to="/access-denied" replace />;
  return <Outlet />;
}
