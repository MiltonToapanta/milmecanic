import { cn } from '../../../lib/utils';
import type { QuotationStatus } from '../types/quotation.types';

const statusLabels: Record<QuotationStatus, string> = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Vencida',
  CANCELLED: 'Cancelada'
};

const statusClasses: Record<QuotationStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  REJECTED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-200',
  EXPIRED: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200 font-bold',
  CANCELLED: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 line-through'
};

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', statusClasses[status])}>
      {statusLabels[status]}
    </span>
  );
}
