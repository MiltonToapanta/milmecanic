import { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader';
import { HelpPanel } from '../../../components/common/HelpPanel';
import {
  useCreateCustomer,
  useDeactivateCustomer
} from '../hooks/use-customers';
import { CustomerForm } from '../components/customer-form';
import type { CustomerPayload } from '../types/customer.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo crear el cliente';
  }
  return 'No se pudo crear el cliente';
}

export function CreateCustomerPage() {
  const navigate = useNavigate();
  const createMutation = useCreateCustomer();
  const deactivateMutation = useDeactivateCustomer();

  const handleSubmit = async (payload: CustomerPayload, isActive: boolean) => {
    try {
      const customer = await createMutation.mutateAsync(payload);
      if (!isActive) await deactivateMutation.mutateAsync(customer.id);
      toast.success('Cliente creado correctamente');
      void navigate('/customers');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Nuevo cliente" description="Registre una persona o empresa." />
      <HelpPanel
        title="Antes de guardar"
        items={[
          'Persona requiere nombres y apellidos.',
          'Empresa requiere razón social.',
          'La identificación es única; revise el listado si el cliente ya existe.',
          'Correo, dirección y notas pueden completarse después.'
        ]}
      />
      <CustomerForm isSubmitting={createMutation.isPending || deactivateMutation.isPending} onSubmit={handleSubmit} />
    </div>
  );
}
