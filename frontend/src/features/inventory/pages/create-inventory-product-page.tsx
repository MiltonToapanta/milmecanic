import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { InventoryProductForm } from '../components/inventory-product-form';
import { useCreateInventoryProduct, useInventoryCategories } from '../hooks/use-inventory';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) return (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar';
  return 'No se pudo guardar';
}

export function CreateInventoryProductPage() {
  const navigate = useNavigate();
  const categoriesQuery = useInventoryCategories({ isActive: true });
  const mutation = useCreateInventoryProduct();

  if (categoriesQuery.isLoading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader title="Nuevo producto" description="Cree la ficha del repuesto o insumo. El stock inicial se registra después con un movimiento." />
      <InventoryProductForm categories={categoriesQuery.data ?? []} isSubmitting={mutation.isPending} onSubmit={(payload) => {
        mutation.mutate(payload, {
          onSuccess: (product) => { toast.success('Producto creado'); void navigate(`/inventory/products/${product.id}`); },
          onError: (error) => toast.error(getErrorMessage(error))
        });
      }} />
    </div>
  );
}
