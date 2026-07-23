import { AxiosError } from 'axios';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { EmptyState } from '../../../components/common/EmptyState';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { SearchInput } from '../../../components/common/SearchInput';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../auth/store/auth.store';
import { InventoryProductTable } from '../components/inventory-product-table';
import { StockMovementForm } from '../components/stock-movement-form';
import { useCreateStockMovement, useDeleteInventoryProduct, useInventoryCategories, useInventoryProducts, useWarehouses } from '../hooks/use-inventory';
import type { InventoryProduct } from '../types/inventory.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) return (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo completar la operación';
  return 'No se pudo completar la operación';
}

export function InventoryProductsPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>();
  const [lowStock, setLowStock] = useState(false);
  const [outOfStock, setOutOfStock] = useState(false);
  const [productToDelete, setProductToDelete] = useState<InventoryProduct | null>(null);
  const [movementProduct, setMovementProduct] = useState<InventoryProduct | null>(null);

  const query = { page, limit: 10, search: search || undefined, categoryId: categoryId || undefined, warehouseId: warehouseId || undefined, isActive, lowStock: lowStock || undefined, outOfStock: outOfStock || undefined };
  const productsQuery = useInventoryProducts(query);
  const categoriesQuery = useInventoryCategories({ isActive: true });
  const warehousesQuery = useWarehouses({ isActive: true });
  const deleteMutation = useDeleteInventoryProduct();
  const movementMutation = useCreateStockMovement();
  const products = productsQuery.data?.items ?? [];
  const pagination = productsQuery.data?.pagination;

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Productos de inventario"
        description="Controle repuestos, insumos, stock mínimo y disponibilidad por bodega."
        action={hasPermission('inventory.products.create') ? <Button><Link to="/inventory/products/new" className="flex items-center gap-2"><Plus className="h-4 w-4" />Nuevo producto</Link></Button> : null}
      />
      <HelpPanel title="Guía de inventario" items={[
        'Primero cree categorías y bodegas; luego registre productos.',
        'El formulario del producto no carga stock: use Registrar movimiento para stock inicial o ajustes.',
        'Stock bajo aparece cuando el disponible es menor o igual al mínimo.',
        'Los movimientos no se editan ni eliminan para conservar el Kardex.'
      ]} />

      <section className="mm-filter-panel sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Buscar</span><SearchInput value={search} onChange={(value) => { setPage(1); setSearch(value); }} placeholder="SKU, producto o código" /></label>
        <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Categoría</span><select className="mm-select" value={categoryId} onChange={(event) => { setPage(1); setCategoryId(event.target.value); }}><option value="">Toda categoría</option>{categoriesQuery.data?.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Bodega</span><select className="mm-select" value={warehouseId} onChange={(event) => { setPage(1); setWarehouseId(event.target.value); }}><option value="">Toda bodega</option>{warehousesQuery.data?.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}</select></label>
        <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Estado</span><select className="mm-select" value={isActive === undefined ? '' : String(isActive)} onChange={(event) => { setPage(1); setIsActive(event.target.value === '' ? undefined : event.target.value === 'true'); }}><option value="">Todo estado</option><option value="true">Activo</option><option value="false">Inactivo</option></select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lowStock} onChange={(event) => { setPage(1); setLowStock(event.target.checked); }} /> Solo con stock bajo</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={outOfStock} onChange={(event) => { setPage(1); setOutOfStock(event.target.checked); }} /> Solo agotados</label>
      </section>

      {productsQuery.isLoading ? <LoadingState /> : null}
      {productsQuery.isError ? <ErrorState message={getErrorMessage(productsQuery.error)} /> : null}
      {!productsQuery.isLoading && !productsQuery.isError && products.length === 0 ? <EmptyState title="No hay productos de inventario" /> : null}
      {products.length > 0 ? <InventoryProductTable products={products} onDelete={setProductToDelete} onMovement={setMovementProduct} /> : null}

      {pagination ? <Pagination page={page} setPage={setPage} total={pagination.total} totalPages={pagination.totalPages} label="productos" /> : null}

      {productToDelete ? (
        <Modal><ConfirmDialog title={`¿Eliminar ${productToDelete.name}? Será una eliminación lógica y no borra el Kardex.`} onConfirm={() => void runAction(async () => { await deleteMutation.mutateAsync(productToDelete.id); setProductToDelete(null); }, 'Producto eliminado')} /><Button variant="secondary" className="mt-3 w-full" onClick={() => setProductToDelete(null)}>Cancelar</Button></Modal>
      ) : null}
      {movementProduct ? (
        <Modal wide>
          <StockMovementForm products={[movementProduct]} warehouses={warehousesQuery.data ?? []} selectedProductId={movementProduct.id} isSubmitting={movementMutation.isPending} onCancel={() => setMovementProduct(null)} onSubmit={(payload) => void runAction(async () => { await movementMutation.mutateAsync(payload); setMovementProduct(null); }, 'Movimiento registrado')} />
        </Modal>
      ) : null}
    </div>
  );
}

export function Pagination({ page, setPage, total, totalPages, label }: { page: number; setPage: (value: number | ((current: number) => number)) => void; total: number; totalPages: number; label: string }) {
  return <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Página {page} de {Math.max(totalPages, 1)} · {total} {label}</span><div className="flex gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Anterior</Button><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Siguiente</Button></div></div>;
}

export function Modal({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"><div className={wide ? 'w-full max-w-3xl' : 'w-full max-w-md'}>{children}</div></div>;
}
