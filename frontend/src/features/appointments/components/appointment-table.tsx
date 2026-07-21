import { Edit, FileText, RefreshCcw, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../auth/store/auth.store';
import type { Appointment } from '../types/appointment.types';
import { AppointmentStatusBadge } from './appointment-status-badge';

interface AppointmentTableProps {
  appointments: Appointment[];
  onChangeStatus: (appointment: Appointment) => void;
  onDelete: (appointment: Appointment) => void;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

export function AppointmentTable({ appointments, onChangeStatus, onDelete }: AppointmentTableProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canUpdate = hasPermission('appointments.update');
  const canChangeStatus = hasPermission('appointments.change-status');
  const canDelete = hasPermission('appointments.delete');
  const canCreateServiceOrder = hasPermission('service-orders.create');

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card">
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">Fecha y hora</th>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Vehículo</th>
            <th className="px-4 py-3 font-medium">Motivo</th>
            <th className="px-4 py-3 font-medium">Asignado</th>
            <th className="px-4 py-3 font-medium">Duración</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appointment) => (
            <tr key={appointment.id} className="border-t border-border align-top">
              <td className="px-4 py-3 font-medium">{formatDateTime(appointment.scheduledAt)}</td>
              <td className="px-4 py-3">
                <p className="font-medium">{appointment.customer.displayName}</p>
                <p className="text-xs text-muted-foreground">{appointment.customer.identification}</p>
              </td>
              <td className="px-4 py-3">
                <p className="font-medium">{appointment.vehicle.plate}</p>
                <p className="text-xs text-muted-foreground">{appointment.vehicle.displayName}</p>
              </td>
              <td className="px-4 py-3">{appointment.reason}</td>
              <td className="px-4 py-3">{appointment.assignedUser?.displayName ?? 'Sin asignar'}</td>
              <td className="px-4 py-3">{appointment.estimatedDurationMinutes} min</td>
              <td className="px-4 py-3"><AppointmentStatusBadge status={appointment.status} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  {canUpdate ? (
                    <Button variant="ghost" className="h-9 w-9 px-0" title="Editar">
                      <Link to={`/appointments/${appointment.id}/edit`}><Edit className="h-4 w-4" /></Link>
                    </Button>
                  ) : null}
                  {canChangeStatus ? (
                    <Button variant="secondary" className="h-9 px-3" onClick={() => onChangeStatus(appointment)} title="Cambiar estado">
                      <RefreshCcw className="h-4 w-4" />
                      Estado
                    </Button>
                  ) : null}
                  {canCreateServiceOrder && appointment.status !== 'CANCELLED' ? (
                    <Button variant="secondary" className="h-9 px-3" title="Crear orden desde esta cita">
                      <Link to={`/service-orders/new?customerId=${appointment.customerId}&vehicleId=${appointment.vehicleId}&appointmentId=${appointment.id}`} className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Orden
                      </Link>
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button variant="ghost" className="h-9 w-9 px-0 text-red-600" onClick={() => onDelete(appointment)} title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
