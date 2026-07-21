import { AxiosError } from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { AppointmentForm } from '../components/appointment-form';
import { useCreateAppointment } from '../hooks/use-appointments';
import type { AppointmentPayload } from '../types/appointment.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo crear la cita';
  }
  return 'No se pudo crear la cita';
}

export function CreateAppointmentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const createMutation = useCreateAppointment();
  const initialCustomerId = searchParams.get('customerId') ?? undefined;
  const initialVehicleId = searchParams.get('vehicleId') ?? undefined;

  const handleSubmit = async (payload: AppointmentPayload) => {
    try {
      await createMutation.mutateAsync(payload);
      toast.success('Cita creada correctamente');
      void navigate('/appointments');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Nueva cita" description="Agende la atención de un vehículo registrado." />
      <HelpPanel
        title="Antes de guardar"
        items={[
          'Seleccione el cliente y luego uno de sus vehículos activos.',
          'La fecha y hora se combinan para crear la agenda exacta.',
          'Use el motivo para explicar qué necesita el cliente.',
          'El usuario asignado puede quedar vacío si todavía no se decide responsable.'
        ]}
      />
      <AppointmentForm
        initialCustomerId={initialCustomerId}
        initialVehicleId={initialVehicleId}
        isSubmitting={createMutation.isPending}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
