import { Edit, Eye, PackagePlus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DataTable } from '../../../components/common/DataTable';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { Button } from '../../../components/ui/button';
import { formatCurrency, formatNumber } from '../../../utils/format';
import { getInventoryUnitLabel } from './inventory-catalogs';
import { InventoryStatusBadge } from './inventory-status-badge';
import type { InventoryProduct } from '../types/inventory.types';

interface Props {
  products: InventoryProduct[];
  onDelete: (product: InventoryProduct) => void;
  onMovement: (product: InventoryProduct) => void;
}

export function InventoryProductTable({ products, onDelete, onMovement }: Props) {
  return (
    <div className="overflow-x-auto">
      <DataTable
        rows={products}
        columns={[
          { header: 'SKU', render: (product) => <span className="font-mono font-semibold">{product.sku}</span> },
          { header: 'Producto', render: (product) => <div><p className="font-medium">{product.name}</p><p className="text-xs text-muted-foreground">{product.barcode || 'Sin código'}</p></div> },
          { header: 'Categoría', render: (product) => product.category.name },
          { header: 'Unidad', render: (product) => getInventoryUnitLabel(product.unit) },
          { header: 'Costo', render: (product) => formatCurrency(product.costPrice) },
          { header: 'Precio de venta', render: (product) => formatCurrency(product.salePrice) },
          { header: 'Stock total', render: (product) => formatNumber(product.totalStock) },
          { header: 'Disponible', render: (product) => formatNumber(product.availableStock) },
          { header: 'Reservado', render: (product) => formatNumber(product.reservedStock) },
          { header: 'Stock mínimo', render: (product) => formatNumber(product.minimumStock) },
          { header: 'Estado', render: (product) => <InventoryStatusBadge product={product} /> },
          {
            header: 'Acciones',
            render: (product) => (
              <div className="flex flex-wrap gap-2">
                <Button variant="ghost" className="h-9 w-9 px-0" title="Ver producto">
                  <Link to={`/inventory/products/${product.id}`}><Eye className="h-4 w-4" /></Link>
                </Button>
                <PermissionGuard permission="inventory.products.update">
                  <Button variant="ghost" className="h-9 w-9 px-0" title="Editar producto">
                    <Link to={`/inventory/products/${product.id}/edit`}><Edit className="h-4 w-4" /></Link>
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="inventory.movements.create">
                  <Button variant="ghost" className="h-9 w-9 px-0" title="Registrar movimiento" onClick={() => onMovement(product)}>
                    <PackagePlus className="h-4 w-4" />
                  </Button>
                </PermissionGuard>
                <PermissionGuard permission="inventory.products.delete">
                  <Button variant="ghost" className="h-9 w-9 px-0 text-red-500" title="Eliminar producto" onClick={() => onDelete(product)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </PermissionGuard>
              </div>
            )
          }
        ]}
      />
    </div>
  );
}
