import { AxiosError } from 'axios';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { DiagnosticForm, type DiagnosticFormSubmitValues } from '../components/diagnostic-form';
import { useAddDiagnosticItem, useDeleteDiagnosticItem, useServiceDiagnosticByOrder, useUpdateDiagnosticItem, useUpdateServiceDiagnostic } from '../hooks/use-service-diagnostics';
import type { DiagnosticItemPayload } from '../types/service-diagnostic.types';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo completar la operación';
  }
  return 'No se pudo completar la operación';
}

function toItemPayload(item: DiagnosticFormSubmitValues['items'][number]): DiagnosticItemPayload {
  return {
    category: item.category,
    itemName: item.itemName,
    status: item.status,
    observation: item.observation,
    severity: item.severity
  };
}

export function EditDiagnosticPage() {
  const { serviceOrderId } = useParams<{ serviceOrderId: string }>();
  const navigate = useNavigate();
  const diagnosticQuery = useServiceDiagnosticByOrder(serviceOrderId ?? '');
  const updateDiagnosticMutation = useUpdateServiceDiagnostic();
  const addItemMutation = useAddDiagnosticItem();
  const updateItemMutation = useUpdateDiagnosticItem();
  const deleteItemMutation = useDeleteDiagnosticItem();
  const diagnostic = diagnosticQuery.data;
  const isSubmitting = updateDiagnosticMutation.isPending || addItemMutation.isPending || updateItemMutation.isPending || deleteItemMutation.isPending;

  const handleSubmit = async (values: DiagnosticFormSubmitValues) => {
    if (!diagnostic || !serviceOrderId) return;
    try {
      await updateDiagnosticMutation.mutateAsync({
        id: diagnostic.id,
        payload: {
          generalObservation: values.generalObservation,
          recommendation: values.recommendation
        }
      });
      for (const itemId of values.deletedItemIds) {
        await deleteItemMutation.mutateAsync({ id: diagnostic.id, itemId });
      }
      for (const item of values.items) {
        const payload = toItemPayload(item);
        if (item.id) {
          await updateItemMutation.mutateAsync({ id: diagnostic.id, itemId: item.id, payload });
        } else {
          await addItemMutation.mutateAsync({ id: diagnostic.id, payload });
        }
      }
      toast.success('Diagnóstico técnico actualizado correctamente');
      void navigate(`/service-orders/${serviceOrderId}/diagnostic`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (diagnosticQuery.isLoading) return <LoadingState />;
  if (diagnosticQuery.isError) return <ErrorState message={getErrorMessage(diagnosticQuery.error)} />;
  if (!diagnostic || !serviceOrderId) return <ErrorState message="Diagnóstico técnico no encontrado" />;
  if (diagnostic.completedAt) return <ErrorState message="El diagnóstico ya fue completado y no puede editarse." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar diagnóstico ${diagnostic.serviceOrder.orderNumber}`}
        description={`${diagnostic.serviceOrder.customer.displayName} · ${diagnostic.serviceOrder.vehicle.plate}`}
        action={
          <Button variant="secondary">
            <Link to={`/service-orders/${serviceOrderId}/diagnostic`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al diagnóstico
            </Link>
          </Button>
        }
      />
      <DiagnosticForm diagnostic={diagnostic} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
    </div>
  );
}
