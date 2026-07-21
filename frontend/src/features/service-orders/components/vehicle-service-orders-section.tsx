import { Eye, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../auth/store/auth.store';
import { useServiceOrdersByVehicle } from '../hooks/use-service-orders';
import { ServiceOrderStatusBadge } from './service-order-status-badge';

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium' }).format(new Date(value));
}

export function VehicleServiceOrdersSection({ vehicleId, customerId }: { vehicleId: string; customerId: string }) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const query = useServiceOrdersByVehicle(vehicleId, { page: 1, limit: 10 });

  return (
    <section className="space-y-4 rounded-md border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Historial de órdenes</h2>
          <p className="mt-1 text-sm text-muted-foreground">Trabajos registrados para este vehículo.</p>
        </div>
        {hasPermission('service-orders.create') ? (
          <Button>
            <Link to={`/service-orders/new?customerId=${customerId}&vehicleId=${vehicleId}`} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nueva orden
            </Link>
          </Button>
        ) : null}
      </div>
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message="No se pudieron cargar las órdenes del vehículo" /> : null}
      {!query.isLoading && !query.isError && (query.data?.items.length ?? 0) === 0 ? <EmptyState title="Este vehículo aún no tiene órdenes de servicio" /> : null}
      {(query.data?.items.length ?? 0) > 0 ? (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Número</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Kilometraje</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((order) => (
                <tr key={order.id} className="border-t border-border">
                  <td className="px-4 py-3 font-semibold">{order.orderNumber}</td>
                  <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3"><ServiceOrderStatusBadge status={order.status} /></td>
                  <td className="px-4 py-3">{order.reportedMileage.toLocaleString('es-EC')} km</td>
                  <td className="px-4 py-3">
                    {hasPermission('service-orders.read') ? (
                      <Button variant="ghost" className="h-9 w-9 px-0" title="Ver orden">
                        <Link to={`/service-orders/${order.id}`}><Eye className="h-4 w-4" /></Link>
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
