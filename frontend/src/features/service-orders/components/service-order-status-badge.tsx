import { serviceOrderStatusOptions } from '../../../config/catalogs';
import { cn } from '../../../lib/utils';
import type { ServiceOrderStatus } from '../types/service-order.types';

const statusClasses: Record<ServiceOrderStatus, string> = {
  RECEIVED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  DIAGNOSIS: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
  WAITING_APPROVAL: 'bg-amber-100 text-amber-700 dark:bg-amber-950',
  APPROVED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950',
  IN_REPAIR: 'bg-sky-100 text-sky-700 dark:bg-sky-950',
  QUALITY_CONTROL: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800',
  READY_FOR_DELIVERY: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-950',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950'
};

function getServiceOrderStatusLabel(status: ServiceOrderStatus): string {
  return serviceOrderStatusOptions.find((option) => option.value === status)?.label ?? status;
}

export function ServiceOrderStatusBadge({ status }: { status: ServiceOrderStatus }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', statusClasses[status])}>
      {getServiceOrderStatusLabel(status)}
    </span>
  );
}
