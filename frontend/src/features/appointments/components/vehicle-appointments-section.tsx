import { CalendarPlus, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../../components/common/EmptyState';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../auth/store/auth.store';
import { useAppointmentsByVehicle } from '../hooks/use-appointments';
import { AppointmentStatusBadge } from './appointment-status-badge';

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function VehicleAppointmentsSection({ vehicleId, customerId }: { vehicleId: string; customerId: string }) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const query = useAppointmentsByVehicle(vehicleId, { page: 1, limit: 20 });

  return (
    <section className="space-y-4 rounded-md border border-border bg-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Historial de citas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Citas registradas para este vehículo.</p>
        </div>
        {hasPermission('appointments.create') ? (
          <Button>
            <Link to={`/appointments/new?customerId=${customerId}&vehicleId=${vehicleId}`} className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              Agendar cita
            </Link>
          </Button>
        ) : null}
      </div>
      {query.isLoading ? <LoadingState /> : null}
      {query.isError ? <ErrorState message="No se pudieron cargar las citas del vehículo" /> : null}
      {!query.isLoading && !query.isError && (query.data?.items.length ?? 0) === 0 ? <EmptyState title="Este vehículo aún no tiene citas registradas" /> : null}
      {(query.data?.items.length ?? 0) > 0 ? (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.items.map((appointment) => (
                <tr key={appointment.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{formatDateTime(appointment.scheduledAt)}</td>
                  <td className="px-4 py-3">{appointment.customer.displayName}</td>
                  <td className="px-4 py-3">{appointment.reason}</td>
                  <td className="px-4 py-3"><AppointmentStatusBadge status={appointment.status} /></td>
                  <td className="px-4 py-3">
                    {hasPermission('appointments.update') ? (
                      <Button variant="ghost" className="h-9 w-9 px-0" title="Editar">
                        <Link to={`/appointments/${appointment.id}/edit`}><Edit className="h-4 w-4" /></Link>
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
