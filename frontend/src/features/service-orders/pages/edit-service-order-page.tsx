import { AxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { ServiceOrderForm } from '../components/service-order-form';
import { useServiceOrder, useUpdateServiceOrder } from '../hooks/use-service-orders';
import type { ServiceOrderPayload } from '../types/service-order.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo actualizar la orden';
  }
  return 'No se pudo actualizar la orden';
}

export function EditServiceOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderQuery = useServiceOrder(id ?? '');
  const updateMutation = useUpdateServiceOrder();

  const handleSubmit = async (payload: ServiceOrderPayload) => {
    if (!id) return;
    try {
      const order = await updateMutation.mutateAsync({ id, payload });
      toast.success(`Orden ${order.orderNumber} actualizada correctamente`);
      void navigate(`/service-orders/${id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (orderQuery.isLoading) return <LoadingState />;
  if (orderQuery.isError) return <ErrorState message={getErrorMessage(orderQuery.error)} />;
  if (!orderQuery.data) return <ErrorState message="Orden no encontrada" />;

  return (
    <div className="space-y-6">
      <PageHeader title={`Editar ${orderQuery.data.orderNumber}`} description="Actualice responsables, recepción y notas iniciales." />
      <HelpPanel
        title="Edición de orden"
        items={[
          'No se puede editar una orden entregada o cancelada.',
          'Los cambios de estado se hacen con el botón Cambiar estado.',
          'Si cambia el cliente, seleccione nuevamente vehículo y cita.',
          'El número de orden no se modifica.'
        ]}
      />
      <ServiceOrderForm serviceOrder={orderQuery.data} isSubmitting={updateMutation.isPending} onSubmit={handleSubmit} />
    </div>
  );
}
