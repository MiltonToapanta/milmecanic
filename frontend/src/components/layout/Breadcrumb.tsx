import { Link, useLocation } from 'react-router-dom';

const labels: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Usuarios',
  customers: 'Clientes',
  vehicles: 'Vehículos',
  new: 'Nuevo',
  edit: 'Editar',
  roles: 'Roles y permisos',
  settings: 'Configuración',
  audit: 'Auditoría',
  profile: 'Perfil'
};

export function Breadcrumb() {
  const parts = useLocation().pathname.split('/').filter(Boolean);
  return (
    <nav className="text-sm text-muted-foreground">
      <Link to="/dashboard" className="hover:text-foreground">MilMecanic</Link>
      {parts.map((part) => <span key={part}> / {labels[part] ?? part}</span>)}
    </nav>
  );
}
