import { BarChart3, Calculator, CalendarDays, Car, ClipboardList, FileText, Gauge, Settings, ShieldCheck, UserRound, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { PermissionGuard } from '../common/PermissionGuard';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/users', label: 'Usuarios', icon: Users, permission: 'users.read' },
  { to: '/customers', label: 'Clientes', icon: UserRound, permission: 'customers.read' },
  { to: '/vehicles', label: 'Vehículos', icon: Car, permission: 'vehicles.read' },
  { to: '/appointments', label: 'Citas', icon: CalendarDays, permission: 'appointments.read' },
  { to: '/service-orders', label: 'Órdenes de servicio', icon: FileText, permission: 'service-orders.read' },
  { to: '/quotations', label: 'Cotizaciones', icon: Calculator, permission: 'quotations.read' },
  { to: '/roles', label: 'Roles y permisos', icon: ShieldCheck, permission: 'roles.read' },
  { to: '/settings', label: 'Configuración', icon: Settings, permission: 'settings.read' },
  { to: '/audit', label: 'Auditoría', icon: ClipboardList, permission: 'audit.read' }
];

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-border bg-card p-4 md:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">MilMecanic</p>
          <p className="text-xs text-muted-foreground">Gestión inteligente para talleres</p>
        </div>
      </div>
      <nav className="space-y-1">
        {items.map((item) => (
          <PermissionGuard key={item.to} permission={item.permission}>
            <NavLink to={item.to} className={({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm transition hover:bg-muted', isActive && 'bg-muted font-medium text-primary')}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          </PermissionGuard>
        ))}
      </nav>
    </aside>
  );
}
