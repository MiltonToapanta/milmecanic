import { Edit, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../auth/store/auth.store';
import { useVehiclesByCustomer } from '../hooks/use-vehicles';
import { VehicleStatusBadge } from './vehicle-status-badge';

export function CustomerVehiclesSection({ customerId }: { customerId: string }) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const query = useVehiclesByCustomer(customerId, { page: 1, limit: 20 });

  return (
    <section className="space-y-4 rounded-md border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Vehículos del cliente</h2>
          <p className="mt-1 text-sm text-muted-foreground">Vehículos registrados para este cliente.</p>
        </div>
        {hasPermission('vehicles.create') ? (
          <Button>
            <Link to={`/vehicles/new?customerId=${customerId}`} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar vehículo
            </Link>
          </Button>
        ) : null}
      </div>
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message="No se pudieron cargar los vehículos del cliente" /> : null}
      {!query.isLoading && !query.isError && (query.data?.items.length ?? 0) === 0 ? <EmptyState title="Este cliente aún no tiene vehículos registrados" /> : null}
      {(query.data?.items.length ?? 0) > 0 ? (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Placa</th>
                <th className="px-4 py-3 font-medium">Marca y modelo</th>
                <th className="px-4 py-3 font-medium">Año</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((vehicle) => (
                <tr key={vehicle.id} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold">{vehicle.plate}</td>
                  <td className="px-4 py-3">{vehicle.brand} {vehicle.model}</td>
                  <td className="px-4 py-3">{vehicle.year}</td>
                  <td className="px-4 py-3"><VehicleStatusBadge active={vehicle.isActive} /></td>
                  <td className="px-4 py-3">
                    {hasPermission('vehicles.update') ? (
                      <Button variant="ghost" className="h-9 w-9 px-0" title="Editar">
                        <Link to={`/vehicles/${vehicle.id}/edit`}><Edit className="h-4 w-4" /></Link>
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
