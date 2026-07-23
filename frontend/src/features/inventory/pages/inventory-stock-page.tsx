import { useState } from 'react';
import { EmptyState } from '../../../components/common/EmptyState';
import { PageHeader } from '../../../components/common/PageHeader';
import { SearchInput } from '../../../components/common/SearchInput';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { formatCurrency, formatNumber } from '../../../utils/format';
import { StockSummaryCards } from '../components/stock-summary-cards';
import { useInventoryCategories, useInventoryProducts, useInventoryStock, useWarehouses } from '../hooks/use-inventory';
import { Pagination } from './inventory-products-page';

function getStockLabel(availableQuantity: number, minimumStock: number) {
  if (availableQuantity <= 0) {
    return 'Agotado';
  }

  if (availableQuantity <= minimumStock) {
    return 'Stock bajo';
  }

  return 'Disponible';
}

export function InventoryStockPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [outOfStock, setOutOfStock] = useState(false);
  const query = { page, limit: 10, search: search || undefined, categoryId: categoryId || undefined, warehouseId: warehouseId || undefined, lowStock: lowStock || undefined, outOfStock: outOfStock || undefined };
  const stockQuery = useInventoryStock(query);
  const allProductsQuery = useInventoryProducts({ page: 1, limit: 100 });
  const categoriesQuery = useInventoryCategories({ isActive: true });
  const warehousesQuery = useWarehouses({ isActive: true });
  const rows = stockQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Stock" description="Revise disponibilidad, stock bajo, agotados y valor estimado por bodega." />
      <StockSummaryCards products={allProductsQuery.data?.items ?? []} />
      <section className="mm-filter-panel sm:grid-cols-2 xl:grid-cols-5">
        <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Buscar</span><SearchInput value={search} onChange={(v) => { setPage(1); setSearch(v); }} placeholder="SKU o producto" /></label>
        <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Categoría</span><select className="mm-select" value={categoryId} onChange={(e) => { setPage(1); setCategoryId(e.target.value); }}><option value="">Toda categoría</option>{categoriesQuery.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="space-y-2"><span className="text-xs font-semibold text-muted-foreground">Bodega</span><select className="mm-select" value={warehouseId} onChange={(e) => { setPage(1); setWarehouseId(e.target.value); }}><option value="">Toda bodega</option>{warehousesQuery.data?.map((w) => <option key={w.id} value={w.id}>{w.code} · {w.name}</option>)}</select></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={lowStock} onChange={(e) => { setPage(1); setLowStock(e.target.checked); }} /> Stock bajo</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={outOfStock} onChange={(e) => { setPage(1); setOutOfStock(e.target.checked); }} /> Agotados</label>
      </section>
      {stockQuery.isLoading ? <LoadingState /> : null}
      {stockQuery.isError ? <ErrorState message="No se pudo cargar el stock" /> : null}
      {!stockQuery.isLoading && rows.length === 0 ? <EmptyState title="No hay stock para mostrar" /> : null}
      {rows.length > 0 ? <div className="overflow-x-auto rounded-md border border-border bg-card"><table className="w-full text-left text-sm"><thead className="bg-muted text-muted-foreground"><tr>{['SKU','Producto','Categoría','Bodega','Stock físico','Reservado','Disponible','Stock mínimo','Costo promedio','Valor','Estado'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{rows.flatMap((row) => (row.stockByWarehouse.length ? row.stockByWarehouse : [{ warehouse: { id: 'none', code: '-', name: 'Sin bodega', isMain: false }, quantity: 0, reservedQuantity: 0, availableQuantity: 0, averageCost: 0 }]).map((stock) => <tr key={`${row.product.id}-${stock.warehouse.id}`} className="border-t border-border"><td className="px-4 py-3 font-mono">{row.product.sku}</td><td className="px-4 py-3">{row.product.name}</td><td className="px-4 py-3">{row.product.category.name}</td><td className="px-4 py-3">{stock.warehouse.code} · {stock.warehouse.name}</td><td className="px-4 py-3">{formatNumber(stock.quantity)}</td><td className="px-4 py-3">{formatNumber(stock.reservedQuantity)}</td><td className="px-4 py-3">{formatNumber(stock.availableQuantity)}</td><td className="px-4 py-3">{formatNumber(row.product.minimumStock)}</td><td className="px-4 py-3">{formatCurrency(stock.averageCost)}</td><td className="px-4 py-3">{formatCurrency(stock.quantity * stock.averageCost)}</td><td className="px-4 py-3">{getStockLabel(stock.availableQuantity, row.product.minimumStock)}</td></tr>))}</tbody></table></div> : null}
      {stockQuery.data?.pagination ? <Pagination page={page} setPage={setPage} total={stockQuery.data.pagination.total} totalPages={stockQuery.data.pagination.totalPages} label="registros" /> : null}
    </div>
  );
}
