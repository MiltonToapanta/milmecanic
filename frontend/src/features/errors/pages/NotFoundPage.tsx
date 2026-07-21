import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';

export function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-3xl font-semibold">Página no encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground">La ruta solicitada no existe en MilMecanic.</p>
      <Button className="mt-5"><Link to="/dashboard">Ir al dashboard</Link></Button>
    </main>
  );
}
