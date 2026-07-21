import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';

export function AccessDeniedPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <ShieldAlert className="h-12 w-12 text-primary" />
      <h1 className="mt-4 text-2xl font-semibold">Acceso denegado</h1>
      <p className="mt-2 text-sm text-muted-foreground">No tiene permisos para abrir esta sección.</p>
      <Button className="mt-5"><Link to="/dashboard">Volver al dashboard</Link></Button>
    </div>
  );
}
