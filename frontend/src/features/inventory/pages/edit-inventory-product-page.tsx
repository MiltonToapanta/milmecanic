import { AxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { InventoryProductForm } from '../components/inventory-product-form';
import { useInventoryCategories, useInventoryProduct, useUpdateInventoryProduct } from '../hooks/use-inventory';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) return (error.response?.data as { message?: string } | undefined)?.message ?? 'No se pudo guardar';
  return 'No se pudo guardar';
}

export function EditInventoryProductPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const productQuery = useInventoryProduct(id);
  const categoriesQuery = useInventoryCategories({ isActive: true });
  const mutation = useUpdateInventoryProduct();

  if (productQuery.isLoading || categoriesQuery.isLoading) return <LoadingState />;
  if (productQuery.isError || !productQuery.data) return <ErrorState message="No se pudo cargar el producto" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Editar producto" description="Actualice datos del producto sin modificar directamente el stock." />
      <InventoryProductForm product={productQuery.data} categories={categoriesQuery.data ?? []} isSubmitting={mutation.isPending} onSubmit={(payload) => {
        mutation.mutate({ id, payload }, {
          onSuccess: () => { toast.success('Producto actualizado'); void navigate(`/inventory/products/${id}`); },
          onError: (error) => toast.error(getErrorMessage(error))
        });
      }} />
    </div>
  );
}
