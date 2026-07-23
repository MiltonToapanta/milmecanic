import { AxiosError } from 'axios';
import { Edit, Plus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { DataTable } from '../../../components/common/DataTable';
import { EmptyState } from '../../../components/common/EmptyState';
import { PageHeader } from '../../../components/common/PageHeader';
import { SearchInput } from '../../../components/common/SearchInput';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { cn } from '../../../lib/utils';
import { formatCurrency, formatNumber } from '../../../utils/format';
import { WarehouseForm } from '../components/warehouse-form';
import { useCreateWarehouse, useDeleteWarehouse, useUpdateWarehouse, useWarehouses } from '../hooks/use-inventory';
import type { Warehouse } from '../types/inventory.types';
import { Modal } from './inventory-products-page';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) return (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo completar';
  return 'No se pudo completar';
}

export function InventoryWarehousesPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Warehouse | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Warehouse | null>(null);
  const [mainCandidate, setMainCandidate] = useState<Warehouse | null>(null);
  const query = useWarehouses({ search: search || undefined });
  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse();
  const deleteMutation = useDeleteWarehouse();
  const warehouses = query.data ?? [];

  const saveWarehouse = (warehouse: Warehouse | null, payload: Parameters<typeof createMutation.mutateAsync>[0]) => {
    const action = warehouse ? updateMutation.mutateAsync({ id: warehouse.id, payload }) : createMutation.mutateAsync(payload);
    void action.then(() => { toast.success(warehouse ? 'Bodega actualizada' : 'Bodega creada'); setCreating(false); setEditing(null); }).catch((error) => toast.error(getErrorMessage(error)));
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Bodegas" description="Administre ubicaciones físicas de stock y una bodega principal." action={<Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />Nueva bodega</Button>} />
      <section className="mm-filter-panel sm:grid-cols-2"><SearchInput value={search} onChange={setSearch} placeholder="Buscar bodega" /></section>
      {query.isLoading ? <LoadingState /> : null}
      {warehouses.length === 0 && !query.isLoading ? <EmptyState title="No hay bodegas" /> : null}
      {warehouses.length > 0 ? <DataTable rows={warehouses} columns={[
        { header: 'Código', render: (w) => <span className="font-mono font-semibold">{w.code}</span> },
        { header: 'Nombre', render: (w) => <span className={cn(w.isMain && 'text-primary font-semibold')}>{w.name}</span> },
        { header: 'Ubicación', render: (w) => w.location || 'Sin ubicación' },
        { header: 'Principal', render: (w) => w.isMain ? <span className="inline-flex items-center gap-1 text-primary"><Star className="h-4 w-4" />Principal</span> : <Button variant="ghost" onClick={() => setMainCandidate(w)}>Marcar</Button> },
        { header: 'Productos', render: (w) => w.productsCount },
        { header: 'Stock total', render: (w) => formatNumber(w.stockTotal) },
        { header: 'Valor del inventario', render: (w) => formatCurrency(w.inventoryValue) },
        { header: 'Estado', render: (w) => <StatusBadge active={w.isActive} /> },
        { header: 'Acciones', render: (w) => <div className="flex gap-2"><Button variant="ghost" className="h-9 w-9 px-0" onClick={() => setEditing(w)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" className="h-9 w-9 px-0 text-red-500" onClick={() => setDeleting(w)}><Trash2 className="h-4 w-4" /></Button></div> }
      ]} /> : null}
      {(creating || editing) ? <Modal wide><WarehouseForm warehouse={editing ?? undefined} isSubmitting={createMutation.isPending || updateMutation.isPending} onCancel={() => { setCreating(false); setEditing(null); }} onSubmit={(payload) => saveWarehouse(editing, payload)} /></Modal> : null}
      {mainCandidate ? <Modal><ConfirmDialog title={`¿Marcar ${mainCandidate.name} como bodega principal? Reemplazará la bodega principal actual.`} onConfirm={() => void updateMutation.mutateAsync({ id: mainCandidate.id, payload: { code: mainCandidate.code, name: mainCandidate.name, description: mainCandidate.description ?? undefined, location: mainCandidate.location ?? undefined, isMain: true, isActive: mainCandidate.isActive } }).then(() => { toast.success('Bodega principal actualizada'); setMainCandidate(null); }).catch((error) => toast.error(getErrorMessage(error)))} /><Button variant="secondary" className="mt-3 w-full" onClick={() => setMainCandidate(null)}>Cancelar</Button></Modal> : null}
      {deleting ? <Modal><ConfirmDialog title={`¿Eliminar ${deleting.name}? Si tiene stock disponible, el backend lo impedirá.`} onConfirm={() => void deleteMutation.mutateAsync(deleting.id).then(() => { toast.success('Bodega eliminada'); setDeleting(null); }).catch((error) => toast.error(getErrorMessage(error)))} /><Button variant="secondary" className="mt-3 w-full" onClick={() => setDeleting(null)}>Cancelar</Button></Modal> : null}
    </div>
  );
}
