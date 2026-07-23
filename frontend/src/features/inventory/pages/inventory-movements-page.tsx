import { AxiosError } from 'axios';
import { Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '../../../components/common/EmptyState';
import { PageHeader } from '../../../components/common/PageHeader';
import { SearchInput } from '../../../components/common/SearchInput';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../auth/store/auth.store';
import { KardexTable } from '../components/kardex-table';
import { StockMovementForm } from '../components/stock-movement-form';
import { stockMovementTypeOptions } from '../components/inventory-catalogs';
import { useCreateStockMovement, useInventoryProducts, useProductKardex, useWarehouses } from '../hooks/use-inventory';
import type { StockMovementType } from '../types/inventory.types';
import { Modal, Pagination } from './inventory-products-page';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) return (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo completar';
  return 'No se pudo completar';
}

export function InventoryMovementsPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [movementType, setMovementType] = useState<StockMovementType | undefined>();
  const [showForm, setShowForm] = useState(false);
  const productsQuery = useInventoryProducts({ page: 1, limit: 100, search: search || undefined, isActive: true });
  const products = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data?.items]);
  const warehousesQuery = useWarehouses({ isActive: true });
  const movementMutation = useCreateStockMovement();

  useEffect(() => {
    if (!productId && products[0]) setProductId(products[0].id);
  }, [productId, products]);

  const kardexQuery = useProductKardex(productId, { page, limit: 10, warehouseId: warehouseId || undefined, movementType });

  return (
    <div className="space-y-6">
      <PageHeader title="Movimientos de stock" description="Consulte el historial por producto y registre entradas o salidas manuales." action={hasPermission('inventory.movements.create') ? <Button onClick={() => setShowForm(true)}><Plus className="mr-2 h-4 w-4" />Registrar movimiento</Button> : null} />
      <section className="mm-filter-panel sm:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Buscar producto</span><SearchInput value={search} onChange={setSearch} placeholder="SKU o nombre" /></label>
        <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Producto</span><select className="mm-select" value={productId} onChange={(e) => { setPage(1); setProductId(e.target.value); }}><option value="">Seleccione producto</option>{products.map((p) => <option key={p.id} value={p.id}>{p.sku} · {p.name}</option>)}</select></label>
        <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Bodega</span><select className="mm-select" value={warehouseId} onChange={(e) => { setPage(1); setWarehouseId(e.target.value); }}><option value="">Toda bodega</option>{warehousesQuery.data?.map((w) => <option key={w.id} value={w.id}>{w.code} · {w.name}</option>)}</select></label>
        <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Tipo</span><select className="mm-select" value={movementType ?? ''} onChange={(e) => { setPage(1); setMovementType(e.target.value ? e.target.value as StockMovementType : undefined); }}><option value="">Todo tipo</option>{stockMovementTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></label>
      </section>
      {kardexQuery.isLoading ? <LoadingState /> : null}
      {!productId ? <EmptyState title="Seleccione un producto para consultar movimientos" /> : null}
      {productId && kardexQuery.data?.items.length === 0 ? <EmptyState title="No hay movimientos para este producto" /> : null}
      {kardexQuery.data?.items.length ? <KardexTable movements={kardexQuery.data.items} /> : null}
      {kardexQuery.data?.pagination ? <Pagination page={page} setPage={setPage} total={kardexQuery.data.pagination.total} totalPages={kardexQuery.data.pagination.totalPages} label="movimientos" /> : null}
      {showForm ? <Modal wide><StockMovementForm products={products} warehouses={warehousesQuery.data ?? []} selectedProductId={productId || undefined} isSubmitting={movementMutation.isPending} onCancel={() => setShowForm(false)} onSubmit={(payload) => movementMutation.mutate(payload, { onSuccess: () => { toast.success('Movimiento registrado'); setShowForm(false); }, onError: (error) => toast.error(getErrorMessage(error)) })} /></Modal> : null}
    </div>
  );
}
