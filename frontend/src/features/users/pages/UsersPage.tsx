import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { DataTable } from '../../../components/common/DataTable';
import { EmptyState } from '../../../components/common/EmptyState';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { SearchInput } from '../../../components/common/SearchInput';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { apiClient } from '../../../services/api-client';
import type { ApiResponse, Role, User } from '../../../types/api';
import { createUser, getUsers } from '../api/users.api';

function getFormString(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
}

async function getRoles(): Promise<Role[]> {
  const { data } = await apiClient.get<ApiResponse<Role[]>>('/roles');
  return data.data;
}

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: getUsers });
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: getRoles });
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      toast.success('Usuario creado');
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
  const users = (usersQuery.data ?? []).filter((user) => `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader title="Usuarios" description="Administración inicial de usuarios del taller." action={<Button onClick={() => setShowForm((value) => !value)}>Nuevo usuario</Button>} />
      <HelpPanel
        title="Guía de usuarios"
        items={[
          'Administrador tiene acceso completo a configuración, usuarios, clientes y auditoría.',
          'Asesor de servicio atiende al cliente y será útil para recepción y seguimiento.',
          'Mecánico, Bodega y Caja quedan preparados para los siguientes módulos operativos.',
          'Use una contraseña temporal y solicite cambiarla antes de producción.'
        ]}
      />
      {showForm ? (
        <form className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-3" onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          createMutation.mutate({
            firstName: getFormString(form, 'firstName'),
            lastName: getFormString(form, 'lastName'),
            email: getFormString(form, 'email'),
            password: getFormString(form, 'password'),
            roleId: getFormString(form, 'roleId'),
            phone: getFormString(form, 'phone')
          });
        }}>
          <Input name="firstName" placeholder="Nombres" required />
          <Input name="lastName" placeholder="Apellidos" required />
          <Input name="email" placeholder="Correo" required type="email" />
          <Input name="password" placeholder="Contraseña temporal" required type="password" />
          <select name="roleId" required className="h-10 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary" defaultValue="">
            <option value="" disabled>Seleccione un rol</option>
            {(rolesQuery.data ?? []).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
          <Input name="phone" placeholder="Teléfono" />
          <Button type="submit" disabled={createMutation.isPending}>Guardar</Button>
        </form>
      ) : null}
      <SearchInput value={search} onChange={setSearch} />
      {usersQuery.isLoading ? <LoadingState /> : users.length === 0 ? <EmptyState title="No hay usuarios para mostrar" /> : (
        <DataTable<User> rows={users} columns={[
          { header: 'Nombre', render: (user) => `${user.firstName} ${user.lastName}` },
          { header: 'Correo', render: (user) => user.email },
          { header: 'Rol', render: (user) => user.role.name },
          { header: 'Estado', render: (user) => <StatusBadge active={user.isActive} /> }
        ]} />
      )}
    </div>
  );
}
