import { AxiosError } from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { ServiceOrderForm } from '../components/service-order-form';
import { useCreateServiceOrder } from '../hooks/use-service-orders';
import type { ServiceOrderPayload } from '../types/service-order.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo crear la orden';
  }
  return 'No se pudo crear la orden';
}

export function CreateServiceOrderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const createMutation = useCreateServiceOrder();
  const initialCustomerId = searchParams.get('customerId') ?? undefined;
  const initialVehicleId = searchParams.get('vehicleId') ?? undefined;
  const initialAppointmentId = searchParams.get('appointmentId') ?? undefined;

  const handleSubmit = async (payload: ServiceOrderPayload) => {
    try {
      const order = await createMutation.mutateAsync(payload);
      toast.success(`Orden ${order.orderNumber} creada correctamente`);
      void navigate(`/service-orders/${order.id}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Nueva orden de servicio" description="Registre la recepción del vehículo y la solicitud inicial del cliente." />
      <HelpPanel
        title="Antes de guardar"
        items={[
          'Seleccione cliente y vehículo activo; no se permiten vehículos de otro cliente.',
          'La cita es opcional y sirve para enlazar la atención con la agenda.',
          'El número de orden se genera automáticamente, por ejemplo OT-000001.',
          'La orden inicia en estado Recibido.'
        ]}
      />
      <ServiceOrderForm
        initialCustomerId={initialCustomerId}
        initialVehicleId={initialVehicleId}
        initialAppointmentId={initialAppointmentId}
        isSubmitting={createMutation.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
