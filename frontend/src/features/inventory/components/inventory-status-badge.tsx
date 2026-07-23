import { PackageCheck, PackageMinus, PackageX, PauseCircle, ToggleLeft } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { InventoryProduct } from '../types/inventory.types';
import { getInventoryStockStatus, type InventoryStockStatus } from './inventory-status-utils';

const statusConfig: Record<InventoryStockStatus, { label: string; className: string; Icon: typeof PackageCheck }> = {
  available: { label: 'Disponible', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950', Icon: PackageCheck },
  low: { label: 'Stock bajo', className: 'bg-amber-100 text-amber-700 dark:bg-amber-950', Icon: PackageMinus },
  out: { label: 'Agotado', className: 'bg-red-100 text-red-700 dark:bg-red-950', Icon: PackageX },
  uncontrolled: { label: 'Sin control de stock', className: 'bg-sky-100 text-sky-700 dark:bg-sky-950', Icon: ToggleLeft },
  inactive: { label: 'Inactivo', className: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800', Icon: PauseCircle }
};

export function InventoryStatusBadge({ product }: { product: InventoryProduct }) {
  const config = statusConfig[getInventoryStockStatus(product)];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', config.className)}>
      <config.Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
