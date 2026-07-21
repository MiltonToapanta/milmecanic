import { useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, CalendarCheck, CheckCircle2, Clock, PlayCircle, UserX, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { appointmentStatusOptions } from '../../../config/catalogs';
import { cn } from '../../../lib/utils';
import type { Appointment, AppointmentStatus } from '../types/appointment.types';
import { AppointmentStatusBadge } from './appointment-status-badge';

interface AppointmentStatusDialogProps {
  appointment: Appointment;
  onCancel: () => void;
  onConfirm: (status: AppointmentStatus, cancellationReason?: string) => void;
}

const statusIcons: Record<AppointmentStatus, ReactNode> = {
  SCHEDULED: <Clock className="h-5 w-5" />,
  CONFIRMED: <CalendarCheck className="h-5 w-5" />,
  IN_PROGRESS: <PlayCircle className="h-5 w-5" />,
  COMPLETED: <CheckCircle2 className="h-5 w-5" />,
  CANCELLED: <XCircle className="h-5 w-5" />,
  NO_SHOW: <UserX className="h-5 w-5" />
};

function getAllowedStatuses(currentStatus: AppointmentStatus): AppointmentStatus[] {
  if (currentStatus === 'SCHEDULED') return ['CONFIRMED', 'IN_PROGRESS', 'CANCELLED', 'NO_SHOW'];
  if (currentStatus === 'CONFIRMED') return ['IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
  if (currentStatus === 'IN_PROGRESS') return ['COMPLETED', 'CANCELLED'];
  if (currentStatus === 'NO_SHOW') return ['SCHEDULED', 'CANCELLED'];
  return [];
}

export function AppointmentStatusDialog({ appointment, onCancel, onConfirm }: AppointmentStatusDialogProps) {
  const allowedStatuses = getAllowedStatuses(appointment.status);
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | ''>(allowedStatuses[0] ?? '');
  const [reason, setReason] = useState('');
  const isCancellation = selectedStatus === 'CANCELLED';
  const selectedOption = appointmentStatusOptions.find((option) => option.value === selectedStatus);
  const canSubmit = Boolean(selectedStatus) && (!isCancellation || reason.trim().length >= 3);
  const isReasonMissing = isCancellation && reason.trim().length < 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <section className="w-full max-w-3xl rounded-lg border border-border bg-card p-5 shadow-lg">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Cambiar estado de la cita</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {appointment.customer.displayName} · {appointment.vehicle.plate} · {appointment.vehicle.displayName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Actual</span>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
        </div>

        {allowedStatuses.length === 0 ? (
          <div className="mt-5 rounded-lg border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
            Esta cita está en un estado final. Si necesita corregirla, edite la cita o cree una nueva programación.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {appointmentStatusOptions.map((option) => {
              const enabled = allowedStatuses.includes(option.value);
              const selected = selectedStatus === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  disabled={!enabled}
                  className={cn(
                    'rounded-lg border border-border bg-background p-4 text-left shadow-sm transition hover:border-primary',
                    selected && 'border-primary ring-2 ring-primary/30',
                    !enabled && 'cursor-not-allowed opacity-45'
                  )}
                  onClick={() => setSelectedStatus(option.value)}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">{statusIcons[option.value]}</div>
                    {selected ? <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">Seleccionado</span> : null}
                  </div>
                  <p className="font-semibold">{option.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p>
                  {!enabled ? <p className="mt-2 text-xs text-muted-foreground">No disponible desde el estado actual.</p> : null}
                </button>
              );
            })}
          </div>
        )}

        {selectedOption ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>{selectedOption.description}</p>
          </div>
        ) : null}

        {isCancellation ? (
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium">Motivo de cancelación</span>
            <textarea
              className="mm-textarea"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ejemplo: el cliente solicitó reprogramar la cita."
            />
            {isReasonMissing ? <span className="text-xs text-red-600">Ingrese al menos 3 caracteres.</span> : null}
          </label>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>Volver</Button>
          <Button disabled={!canSubmit} onClick={() => selectedStatus && onConfirm(selectedStatus, isCancellation ? reason.trim() : undefined)}>Guardar estado</Button>
        </div>
      </section>
    </div>
  );
}
