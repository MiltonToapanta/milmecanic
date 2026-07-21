import { LogOut, UserCircle } from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { Button } from '../ui/button';

export function UserMenu() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
        <p className="text-xs text-muted-foreground">{user?.role.name}</p>
      </div>
      <UserCircle className="h-7 w-7 text-muted-foreground" />
      <Button variant="ghost" className="w-10 px-0" onClick={() => void logout()} title="Cerrar sesión">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
