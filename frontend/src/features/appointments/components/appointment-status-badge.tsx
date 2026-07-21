import { appointmentStatusOptions } from '../../../config/catalogs';
import { cn } from '../../../lib/utils';
import type { AppointmentStatus } from '../types/appointment.types';

const statusClasses: Record<AppointmentStatus, string> = {
  SCHEDULED: 'bg-sky-100 text-sky-700 dark:bg-sky-950',
  CONFIRMED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 dark:bg-amber-950',
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950',
  NO_SHOW: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800'
};

function getAppointmentStatusLabel(status: AppointmentStatus): string {
  return appointmentStatusOptions.find((option) => option.value === status)?.label ?? status;
}

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <span className={cn('rounded-full px-2 py-1 text-xs font-medium', statusClasses[status])}>{getAppointmentStatusLabel(status)}</span>;
}
