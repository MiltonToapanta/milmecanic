import { AlertTriangle, Boxes, CircleDollarSign, PackageCheck, PackageX } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../utils/format';
import type { InventoryProduct } from '../types/inventory.types';

export function StockSummaryCards({ products }: { products: InventoryProduct[] }) {
  const activeProducts = products.filter((product) => product.isActive);
  const unitsInStock = activeProducts.reduce((sum, product) => sum + product.totalStock, 0);
  const lowStock = activeProducts.filter((product) => product.isStockControlled && product.availableStock > 0 && product.availableStock <= Number(product.minimumStock)).length;
  const outOfStock = activeProducts.filter((product) => product.isStockControlled && product.availableStock <= 0).length;
  const inventoryValue = activeProducts.reduce(
    (sum, product) => sum + product.stockByWarehouse.reduce((warehouseSum, stock) => warehouseSum + stock.quantity * stock.averageCost, 0),
    0
  );

  const cards = [
    { label: 'Productos activos', value: activeProducts.length, Icon: Boxes },
    { label: 'Unidades en stock', value: formatNumber(unitsInStock), Icon: PackageCheck },
    { label: 'Productos con stock bajo', value: lowStock, Icon: AlertTriangle },
    { label: 'Productos agotados', value: outOfStock, Icon: PackageX },
    { label: 'Valor estimado del inventario', value: formatCurrency(inventoryValue), Icon: CircleDollarSign }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-md border border-border bg-card p-4">
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <card.Icon className="h-4 w-4" />
          </div>
          <p className="text-xs text-muted-foreground">{card.label}</p>
          <p className="mt-1 text-xl font-semibold">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
