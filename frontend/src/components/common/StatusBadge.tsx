import { cn } from '../../lib/utils';

export function StatusBadge({ active }: { active: boolean }) {
  return <span className={cn('rounded-full px-2 py-1 text-xs font-medium', active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950' : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800')}>{active ? 'Activo' : 'Inactivo'}</span>;
}
