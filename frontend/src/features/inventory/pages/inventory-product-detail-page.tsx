import { AxiosError } from 'axios';
import { ArrowLeft, Edit, PackagePlus, Trash2, Workflow } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { PageHeader } from '../../../components/common/PageHeader';
import { PermissionGuard } from '../../../components/common/PermissionGuard';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { formatCurrency, formatDateTime, formatNumber } from '../../../utils/format';
import { StockMovementForm } from '../components/stock-movement-form';
import { getInventoryUnitLabel } from '../components/inventory-catalogs';
import { InventoryStatusBadge } from '../components/inventory-status-badge';
import { useCreateStockMovement, useDeleteInventoryProduct, useInventoryProduct, useWarehouses } from '../hooks/use-inventory';
import { Modal } from './inventory-products-page';
import { useState } from 'react';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) return (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo completar';
  return 'No se pudo completar';
}

export function InventoryProductDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const productQuery = useInventoryProduct(id);
  const warehousesQuery = useWarehouses({ isActive: true });
  const movementMutation = useCreateStockMovement();
  const deleteMutation = useDeleteInventoryProduct();
  const [showMovement, setShowMovement] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (productQuery.isLoading) return <LoadingState />;
  if (productQuery.isError || !productQuery.data) return <ErrorState message="No se pudo cargar el producto" />;

  const product = productQuery.data;
  const inventoryValue = product.stockByWarehouse.reduce((sum, stock) => sum + stock.quantity * stock.averageCost, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={`SKU ${product.sku} · ${product.category.name}`}
        action={<Button variant="secondary"><Link to="/inventory/products" className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />Volver</Link></Button>}
      />
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-md border border-border bg-card p-5">
          <div className="mb-5 flex flex-wrap items-center gap-3"><InventoryStatusBadge product={product} /><span className="text-sm text-muted-foreground">Actualizado {formatDateTime(product.updatedAt)}</span></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Info label="Código de barras" value={product.barcode || 'Sin código'} />
            <Info label="Unidad" value={getInventoryUnitLabel(product.unit)} />
            <Info label="Costo" value={formatCurrency(product.costPrice)} />
            <Info label="Precio de venta" value={formatCurrency(product.salePrice)} />
            <Info label="Stock mínimo" value={formatNumber(product.minimumStock)} />
            <Info label="Stock máximo" value={product.maximumStock ? formatNumber(product.maximumStock) : 'Sin máximo'} />
            <Info label="Stock total" value={formatNumber(product.totalStock)} />
            <Info label="Disponible" value={formatNumber(product.availableStock)} />
            <Info label="Reservado" value={formatNumber(product.reservedStock)} />
            <Info label="Valor estimado" value={formatCurrency(inventoryValue)} />
            <Info label="Creado" value={formatDateTime(product.createdAt)} />
            <Info label="Control de stock" value={product.isStockControlled ? 'Sí' : 'No'} />
          </div>
          {product.description ? <p className="mt-5 rounded-md bg-muted p-3 text-sm text-muted-foreground">{product.description}</p> : null}
        </div>
        <div className="rounded-md border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold">Acciones</h2>
          <div className="grid gap-2">
            <PermissionGuard permission="inventory.products.update"><Button variant="secondary"><Link to={`/inventory/products/${id}/edit`} className="flex items-center gap-2"><Edit className="h-4 w-4" />Editar</Link></Button></PermissionGuard>
            <PermissionGuard permission="inventory.movements.create"><Button onClick={() => setShowMovement(true)}><PackagePlus className="mr-2 h-4 w-4" />Registrar movimiento</Button></PermissionGuard>
            <PermissionGuard permission="inventory.kardex.read"><Button variant="secondary"><Link to={`/inventory/products/${id}/kardex`} className="flex items-center gap-2"><Workflow className="h-4 w-4" />Ver Kardex</Link></Button></PermissionGuard>
            <PermissionGuard permission="inventory.products.delete"><Button variant="danger" onClick={() => setConfirmDelete(true)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button></PermissionGuard>
          </div>
        </div>
      </section>
      <section className="rounded-md border border-border bg-card p-5">
        <h2 className="mb-4 font-semibold">Distribución por bodega</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm"><thead className="bg-muted text-muted-foreground"><tr>{['Bodega','Stock físico','Reservado','Disponible','Costo promedio','Valor total','Última actualización'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{product.stockByWarehouse.map((stock) => <tr key={stock.warehouse.id} className="border-t border-border"><td className="px-4 py-3">{stock.warehouse.code} · {stock.warehouse.name}</td><td className="px-4 py-3">{formatNumber(stock.quantity)}</td><td className="px-4 py-3">{formatNumber(stock.reservedQuantity)}</td><td className="px-4 py-3">{formatNumber(stock.availableQuantity)}</td><td className="px-4 py-3">{formatCurrency(stock.averageCost)}</td><td className="px-4 py-3">{formatCurrency(stock.quantity * stock.averageCost)}</td><td className="px-4 py-3">{formatDateTime(product.updatedAt)}</td></tr>)}</tbody></table>
        </div>
        {product.stockByWarehouse.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aún no hay stock registrado. Use Registrar movimiento para cargar stock inicial.</p> : null}
      </section>
      {showMovement ? <Modal wide><StockMovementForm products={[product]} warehouses={warehousesQuery.data ?? []} selectedProductId={product.id} isSubmitting={movementMutation.isPending} onCancel={() => setShowMovement(false)} onSubmit={(payload) => movementMutation.mutate(payload, { onSuccess: () => { toast.success('Movimiento registrado'); setShowMovement(false); }, onError: (error) => toast.error(getErrorMessage(error)) })} /></Modal> : null}
      {confirmDelete ? <Modal><ConfirmDialog title={`¿Eliminar ${product.name}? No se eliminarán movimientos anteriores.`} onConfirm={() => deleteMutation.mutate(product.id, { onSuccess: () => { toast.success('Producto eliminado'); void navigate('/inventory/products'); }, onError: (error) => toast.error(getErrorMessage(error)) })} /><Button variant="secondary" className="mt-3 w-full" onClick={() => setConfirmDelete(false)}>Cancelar</Button></Modal> : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value}</p></div>;
}
