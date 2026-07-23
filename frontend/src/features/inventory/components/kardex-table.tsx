import { DataTable } from '../../../components/common/DataTable';
import { formatCurrency, formatDateTime, formatNumber } from '../../../utils/format';
import { getStockMovementTypeLabel, getStockReferenceTypeLabel } from './inventory-catalogs';
import type { StockMovement } from '../types/inventory.types';

export function KardexTable({ movements }: { movements: StockMovement[] }) {
  return (
    <div className="overflow-x-auto">
      <DataTable
        rows={movements}
        columns={[
          { header: 'Fecha', render: (movement) => formatDateTime(movement.createdAt) },
          { header: 'Movimiento', render: (movement) => <span className="font-mono font-semibold">{movement.movementNumber}</span> },
          { header: 'Tipo', render: (movement) => getStockMovementTypeLabel(movement.movementType) },
          { header: 'Bodega', render: (movement) => `${movement.warehouse.code} · ${movement.warehouse.name}` },
          { header: 'Entrada', render: (movement) => formatNumber(movement.entryQuantity) },
          { header: 'Salida', render: (movement) => formatNumber(movement.exitQuantity) },
          { header: 'Stock anterior', render: (movement) => formatNumber(movement.previousStock) },
          { header: 'Stock nuevo', render: (movement) => formatNumber(movement.newStock) },
          { header: 'Costo unitario', render: (movement) => formatCurrency(movement.unitCost) },
          { header: 'Costo total', render: (movement) => formatCurrency(movement.totalCost) },
          { header: 'Referencia', render: (movement) => `${getStockReferenceTypeLabel(movement.referenceType)}${movement.referenceId ? ` · ${movement.referenceId}` : ''}` },
          { header: 'Motivo', render: (movement) => movement.reason || 'Sin motivo' },
          { header: 'Usuario', render: (movement) => movement.user?.displayName ?? 'Sistema' }
        ]}
      />
    </div>
  );
}
