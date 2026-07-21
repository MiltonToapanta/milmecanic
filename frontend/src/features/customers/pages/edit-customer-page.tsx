import { AxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { CustomerForm } from '../components/customer-form';
import { CustomerAppointmentsSection } from '../../appointments/components/customer-appointments-section';
import { CustomerServiceOrdersSection } from '../../service-orders/components/customer-service-orders-section';
import { CustomerVehiclesSection } from '../../vehicles/components/customer-vehicles-section';
import {
  useActivateCustomer,
  useCustomer,
  useDeactivateCustomer,
  useUpdateCustomer
} from '../hooks/use-customers';
import type { CustomerPayload } from '../types/customer.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo actualizar el cliente';
  }
  return 'No se pudo actualizar el cliente';
}

export function EditCustomerPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const customerQuery = useCustomer(id ?? '');
  const updateMutation = useUpdateCustomer();
  const activateMutation = useActivateCustomer();
  const deactivateMutation = useDeactivateCustomer();

  const handleSubmit = async (payload: CustomerPayload, isActive: boolean) => {
    if (!id) return;
    try {
      const customer = await updateMutation.mutateAsync({ id, payload });
      if (customer.isActive !== isActive) {
        if (isActive) await activateMutation.mutateAsync(id);
        else await deactivateMutation.mutateAsync(id);
      }
      toast.success('Cliente actualizado correctamente');
      void navigate('/customers');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (customerQuery.isLoading) return <LoadingState />;
  if (customerQuery.isError) return <ErrorState message={getErrorMessage(customerQuery.error)} />;
  if (!customerQuery.data) return <ErrorState message="Cliente no encontrado" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Editar cliente" description="Actualice la información básica del cliente." />
      <HelpPanel
        title="Edición de cliente"
        items={[
          'Cambiar Persona o Empresa ajusta los campos requeridos.',
          'Use Inactivo cuando el cliente no deba aparecer en nuevos procesos.',
          'La eliminación se realiza desde el listado y conserva el historial.',
          'Mantenga teléfonos y correo actualizados para contacto operativo.'
        ]}
      />
      <CustomerForm
        customer={customerQuery.data}
        isSubmitting={updateMutation.isPending || activateMutation.isPending || deactivateMutation.isPending}
        onSubmit={handleSubmit}
      />
      <CustomerServiceOrdersSection customerId={customerQuery.data.id} />
      <CustomerAppointmentsSection customerId={customerQuery.data.id} />
      <CustomerVehiclesSection customerId={customerQuery.data.id} />
    </div>
  );
}
