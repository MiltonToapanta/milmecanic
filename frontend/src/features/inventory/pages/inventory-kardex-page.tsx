import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import { EmptyState } from '../../../components/common/EmptyState';
import { PageHeader } from '../../../components/common/PageHeader';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { formatCurrency, formatNumber } from '../../../utils/format';
import { KardexTable } from '../components/kardex-table';
import { stockMovementTypeOptions } from '../components/inventory-catalogs';
import { useInventoryProduct, useProductKardex, useWarehouses } from '../hooks/use-inventory';
import type { StockMovementType } from '../types/inventory.types';
import { Pagination } from './inventory-products-page';

export function InventoryKardexPage() {
  const { productId = '' } = useParams();
  const [page, setPage] = useState(1);
  const [warehouseId, setWarehouseId] = useState('');
  const [movementType, setMovementType] = useState<StockMovementType | undefined>();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const productQuery = useInventoryProduct(productId);
  const warehousesQuery = useWarehouses({ isActive: true });
  const kardexQuery = useProductKardex(productId, { page, limit: 10, warehouseId: warehouseId || undefined, movementType, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
  const product = productQuery.data;
  const averageCost = product?.stockByWarehouse.length ? product.stockByWarehouse.reduce((s, i) => s + i.averageCost, 0) / product.stockByWarehouse.length : 0;
  const value = product?.stockByWarehouse.reduce((s, i) => s + i.quantity * i.averageCost, 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Kardex" description={product ? `${product.sku} · ${product.name}` : 'Movimientos del producto'} action={<Button variant="secondary"><Link to={`/inventory/products/${productId}`} className="flex items-center gap-2"><ArrowLeft className="h-4 w-4" />Volver al producto</Link></Button>} />
      {productQuery.isLoading ? <LoadingState /> : null}
      {product ? <div className="grid gap-3 sm:grid-cols-4"><Info label="Stock total" value={formatNumber(product.totalStock)} /><Info label="Disponible" value={formatNumber(product.availableStock)} /><Info label="Costo promedio" value={formatCurrency(averageCost)} /><Info label="Valor estimado" value={formatCurrency(value)} /></div> : null}
      <section className="mm-filter-panel sm:grid-cols-2 xl:grid-cols-4">
        <select className="mm-select" value={warehouseId} onChange={(e) => { setPage(1); setWarehouseId(e.target.value); }}><option value="">Toda bodega</option>{warehousesQuery.data?.map((w) => <option key={w.id} value={w.id}>{w.code} · {w.name}</option>)}</select>
        <select className="mm-select" value={movementType ?? ''} onChange={(e) => { setPage(1); setMovementType(e.target.value ? e.target.value as StockMovementType : undefined); }}><option value="">Todo movimiento</option>{stockMovementTypeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <input className="mm-input" type="date" value={dateFrom} onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
        <input className="mm-input" type="date" value={dateTo} onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
      </section>
      {kardexQuery.isLoading ? <LoadingState /> : null}
      {kardexQuery.data?.items.length === 0 ? <EmptyState title="Aún no hay movimientos para este producto" /> : null}
      {kardexQuery.data?.items.length ? <KardexTable movements={kardexQuery.data.items} /> : null}
      {kardexQuery.data?.pagination ? <Pagination page={page} setPage={setPage} total={kardexQuery.data.pagination.total} totalPages={kardexQuery.data.pagination.totalPages} label="movimientos" /> : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold">{value}</p></div>;
}
