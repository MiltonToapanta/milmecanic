import { AxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { VehicleAppointmentsSection } from '../../appointments/components/vehicle-appointments-section';
import { VehicleForm } from '../components/vehicle-form';
import { useActivateVehicle, useDeactivateVehicle, useUpdateVehicle, useVehicle } from '../hooks/use-vehicles';
import type { VehiclePayload } from '../types/vehicle.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo actualizar el vehículo';
  }
  return 'No se pudo actualizar el vehículo';
}

export function EditVehiclePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const vehicleQuery = useVehicle(id ?? '');
  const updateMutation = useUpdateVehicle();
  const activateMutation = useActivateVehicle();
  const deactivateMutation = useDeactivateVehicle();

  const handleSubmit = async (payload: VehiclePayload, isActive: boolean) => {
    if (!id) return;
    try {
      const vehicle = await updateMutation.mutateAsync({ id, payload });
      if (vehicle.isActive !== isActive) {
        if (isActive) await activateMutation.mutateAsync(id);
        else await deactivateMutation.mutateAsync(id);
      }
      toast.success('Vehículo actualizado correctamente');
      void navigate('/vehicles');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (vehicleQuery.isLoading) return <LoadingState />;
  if (vehicleQuery.isError) return <ErrorState message={getErrorMessage(vehicleQuery.error)} />;
  if (!vehicleQuery.data) return <ErrorState message="Vehículo no encontrado" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Editar vehículo" description="Actualice la información del vehículo." />
      <HelpPanel
        title="Edición de vehículo"
        items={[
          'Cambiar el cliente mueve el vehículo a otro propietario activo.',
          'Use Inactivo cuando el vehículo no deba usarse operativamente.',
          'La eliminación se realiza desde el listado y conserva trazabilidad.',
          'Mantenga kilometraje y datos técnicos actualizados.'
        ]}
      />
      <VehicleForm
        vehicle={vehicleQuery.data}
        isSubmitting={updateMutation.isPending || activateMutation.isPending || deactivateMutation.isPending}
        onSubmit={handleSubmit}
      />
      <VehicleAppointmentsSection vehicleId={vehicleQuery.data.id} customerId={vehicleQuery.data.customerId} />
    </div>
  );
}
