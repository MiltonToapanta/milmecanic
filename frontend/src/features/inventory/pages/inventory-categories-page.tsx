import { AxiosError } from 'axios';
import { Edit, Plus, Trash2 } from 'lucide-react';
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
import { InventoryCategoryForm } from '../components/inventory-category-form';
import { useCreateInventoryCategory, useDeleteInventoryCategory, useInventoryCategories, useUpdateInventoryCategory } from '../hooks/use-inventory';
import type { InventoryCategory } from '../types/inventory.types';
import { Modal } from './inventory-products-page';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) return (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo completar';
  return 'No se pudo completar';
}

export function InventoryCategoriesPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<InventoryCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<InventoryCategory | null>(null);
  const query = useInventoryCategories({ search: search || undefined });
  const createMutation = useCreateInventoryCategory();
  const updateMutation = useUpdateInventoryCategory();
  const deleteMutation = useDeleteInventoryCategory();
  const categories = query.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title="Categorías" description="Organice productos por familias fáciles de buscar." action={<Button onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" />Nueva categoría</Button>} />
      <section className="mm-filter-panel sm:grid-cols-2"><SearchInput value={search} onChange={setSearch} placeholder="Buscar categoría" /></section>
      {query.isLoading ? <LoadingState /> : null}
      {categories.length === 0 && !query.isLoading ? <EmptyState title="No hay categorías" /> : null}
      {categories.length > 0 ? <DataTable rows={categories} columns={[
        { header: 'Nombre', render: (c) => <span className="font-medium">{c.name}</span> },
        { header: 'Descripción', render: (c) => c.description || 'Sin descripción' },
        { header: 'Productos activos', render: (c) => c.activeProductsCount },
        { header: 'Estado', render: (c) => <StatusBadge active={c.isActive} /> },
        { header: 'Acciones', render: (c) => <div className="flex gap-2"><Button variant="ghost" className="h-9 w-9 px-0" onClick={() => setEditing(c)}><Edit className="h-4 w-4" /></Button><Button variant="ghost" className="h-9 w-9 px-0 text-red-500" onClick={() => setDeleting(c)}><Trash2 className="h-4 w-4" /></Button></div> }
      ]} /> : null}
      {(creating || editing) ? <Modal wide><InventoryCategoryForm category={editing ?? undefined} isSubmitting={createMutation.isPending || updateMutation.isPending} onCancel={() => { setCreating(false); setEditing(null); }} onSubmit={(payload) => {
        const action = editing ? updateMutation.mutateAsync({ id: editing.id, payload }) : createMutation.mutateAsync(payload);
        void action.then(() => { toast.success(editing ? 'Categoría actualizada' : 'Categoría creada'); setCreating(false); setEditing(null); }).catch((error) => toast.error(getErrorMessage(error)));
      }} /></Modal> : null}
      {deleting ? <Modal><ConfirmDialog title={`¿Eliminar ${deleting.name}? Si tiene productos activos, el backend lo impedirá.`} onConfirm={() => void deleteMutation.mutateAsync(deleting.id).then(() => { toast.success('Categoría eliminada'); setDeleting(null); }).catch((error) => toast.error(getErrorMessage(error)))} /><Button variant="secondary" className="mt-3 w-full" onClick={() => setDeleting(null)}>Cancelar</Button></Modal> : null}
    </div>
  );
}
