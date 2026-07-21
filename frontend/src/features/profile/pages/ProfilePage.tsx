import { PageHeader } from '../../../components/common/PageHeader';
import { useAuthStore } from '../../auth/store/auth.store';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  return (
    <div className="space-y-6">
      <PageHeader title="Perfil" description="Información de la sesión actual." />
      <section className="rounded-md border border-border bg-card p-5">
        <p className="text-lg font-semibold">{user?.firstName} {user?.lastName}</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
        <p className="mt-4 text-sm">Rol: <span className="font-medium">{user?.role.name}</span></p>
      </section>
    </div>
  );
}
