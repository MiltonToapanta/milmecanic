import { AxiosError } from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { AppointmentForm } from '../components/appointment-form';
import { useAppointment, useUpdateAppointment } from '../hooks/use-appointments';
import type { AppointmentPayload } from '../types/appointment.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo actualizar la cita';
  }
  return 'No se pudo actualizar la cita';
}

export function EditAppointmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const appointmentQuery = useAppointment(id ?? '');
  const updateMutation = useUpdateAppointment();

  const handleSubmit = async (payload: AppointmentPayload) => {
    if (!id) return;
    try {
      await updateMutation.mutateAsync({ id, payload });
      toast.success('Cita actualizada correctamente');
      void navigate('/appointments');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (appointmentQuery.isLoading) return <LoadingState />;
  if (appointmentQuery.isError) return <ErrorState message={getErrorMessage(appointmentQuery.error)} />;
  if (!appointmentQuery.data) return <ErrorState message="Cita no encontrada" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Editar cita" description="Actualice la agenda, responsable o motivo de atención." />
      <HelpPanel
        title="Edición de cita"
        items={[
          'Si cambia el cliente, seleccione nuevamente un vehículo de ese cliente.',
          'Los cambios de estado se realizan desde el listado de citas.',
          'Para cancelar se pedirá un motivo de cancelación.',
          'No se crean órdenes de servicio desde esta pantalla todavía.'
        ]}
      />
      <AppointmentForm appointment={appointmentQuery.data} isSubmitting={updateMutation.isPending} onSubmit={handleSubmit} />
    </div>
  );
}
