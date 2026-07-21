import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../../components/common/DataTable';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { apiClient } from '../../../services/api-client';
import type { ApiResponse, Role } from '../../../types/api';

async function getRoles(): Promise<Role[]> {
  const { data } = await apiClient.get<ApiResponse<Role[]>>('/roles');
  return data.data;
}

const permissionLabels: Record<string, string> = {
  'users.read': 'Ver usuarios',
  'users.create': 'Crear usuarios',
  'users.update': 'Actualizar usuarios',
  'users.change-status': 'Activar o desactivar usuarios',
  'users.change-password': 'Cambiar contraseñas',
  'customers.read': 'Ver clientes',
  'customers.create': 'Crear clientes',
  'customers.update': 'Actualizar clientes',
  'customers.change-status': 'Activar o desactivar clientes',
  'customers.delete': 'Eliminar clientes',
  'vehicles.read': 'Ver vehículos',
  'vehicles.create': 'Crear vehículos',
  'vehicles.update': 'Actualizar vehículos',
  'vehicles.change-status': 'Activar o desactivar vehículos',
  'vehicles.delete': 'Eliminar vehículos',
  'appointments.read': 'Ver citas',
  'appointments.create': 'Crear citas',
  'appointments.update': 'Actualizar citas',
  'appointments.change-status': 'Cambiar estado de citas',
  'appointments.delete': 'Eliminar citas',
  'roles.read': 'Ver roles y permisos',
  'settings.read': 'Ver configuración',
  'settings.update': 'Actualizar configuración',
  'audit.read': 'Ver auditoría'
};

export function RolesPage() {
  const query = useQuery({ queryKey: ['roles'], queryFn: getRoles });
  return (
    <div className="space-y-6">
      <PageHeader title="Roles y permisos" description="Estructura base de acceso para MilMecanic." />
      <HelpPanel
        title="Guía de roles"
        items={[
          'Un rol agrupa permisos para que el usuario vea solo las áreas que necesita.',
          'Administrador recibe todos los permisos iniciales del sistema.',
          'Los roles operativos quedan preparados para recepción, taller, bodega y caja.',
          'Si una pantalla muestra acceso denegado, revise los permisos del rol asignado.'
        ]}
      />
      {query.isLoading ? <LoadingState /> : (
        <DataTable<Role> rows={query.data ?? []} columns={[
          { header: 'Rol', render: (role) => role.name },
          { header: 'Permisos', render: (role) => <span className="text-sm text-muted-foreground">{role.rolePermissions?.map((item) => permissionLabels[item.permission.code] ?? item.permission.code).join(', ') || 'Sin permisos asignados'}</span> }
        ]} />
      )}
    </div>
  );
}
