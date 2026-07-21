import { AxiosError } from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { VehicleForm } from '../components/vehicle-form';
import { useCreateVehicle, useDeactivateVehicle } from '../hooks/use-vehicles';
import type { VehiclePayload } from '../types/vehicle.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo crear el vehículo';
  }
  return 'No se pudo crear el vehículo';
}

export function CreateVehiclePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const createMutation = useCreateVehicle();
  const deactivateMutation = useDeactivateVehicle();
  const initialCustomerId = searchParams.get('customerId') ?? undefined;

  const handleSubmit = async (payload: VehiclePayload, isActive: boolean) => {
    try {
      const vehicle = await createMutation.mutateAsync(payload);
      if (!isActive) await deactivateMutation.mutateAsync(vehicle.id);
      toast.success('Vehículo creado correctamente');
      void navigate(initialCustomerId ? `/customers/${initialCustomerId}/edit` : '/vehicles');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Nuevo vehículo" description="Registre un vehículo para un cliente activo." />
      <HelpPanel
        title="Antes de guardar"
        items={[
          'Seleccione primero el cliente propietario.',
          'La placa se convierte automáticamente a mayúsculas.',
          'VIN, motor y chasis son opcionales, pero ayudan a identificar mejor el vehículo.',
          'El kilometraje debe ser cero o mayor.'
        ]}
      />
      <VehicleForm initialCustomerId={initialCustomerId} isSubmitting={createMutation.isPending || deactivateMutation.isPending} onSubmit={handleSubmit} />
    </div>
  );
}
