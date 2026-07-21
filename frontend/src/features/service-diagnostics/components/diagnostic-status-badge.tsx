import { CheckCircle2, CircleAlert, CircleHelp, CircleMinus, CircleSlash, Wrench } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { severityLabels, statusLabels } from '../schemas/service-diagnostic.schema';
import type { DiagnosticItemStatus, DiagnosticSeverity, ServiceDiagnostic } from '../types/service-diagnostic.types';

const itemStatusStyles: Record<DiagnosticItemStatus, string> = {
  GOOD: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  REGULAR: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  BAD: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  NOT_CHECKED: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
};

const severityStyles: Record<DiagnosticSeverity, string> = {
  LOW: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  HIGH: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  CRITICAL: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
};

export function DiagnosticStatusBadge({ diagnostic }: { diagnostic: ServiceDiagnostic }) {
  const completed = Boolean(diagnostic.completedAt);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        completed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'
      )}
    >
      {completed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Wrench className="h-3.5 w-3.5" />}
      {completed ? 'Completado' : 'En edición'}
    </span>
  );
}

export function DiagnosticItemStatusBadge({ status }: { status: DiagnosticItemStatus }) {
  const Icon = status === 'GOOD' ? CheckCircle2 : status === 'REGULAR' ? CircleMinus : status === 'BAD' ? CircleAlert : CircleHelp;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', itemStatusStyles[status])}>
      <Icon className="h-3.5 w-3.5" />
      {statusLabels[status]}
    </span>
  );
}

export function DiagnosticSeverityBadge({ severity }: { severity?: DiagnosticSeverity | null }) {
  if (!severity) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
        <CircleSlash className="h-3.5 w-3.5" />
        Sin severidad
      </span>
    );
  }
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold', severityStyles[severity])}>{severityLabels[severity]}</span>;
}
