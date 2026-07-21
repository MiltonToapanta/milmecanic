import { AxiosError } from 'axios';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { useServiceOrder } from '../../service-orders/hooks/use-service-orders';
import { DiagnosticForm, type DiagnosticFormSubmitValues } from '../components/diagnostic-form';
import { useCreateServiceDiagnostic, useServiceDiagnosticByOrder } from '../hooks/use-service-diagnostics';
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

export function CreateDiagnosticPage() {
  const { serviceOrderId } = useParams<{ serviceOrderId: string }>();
  const navigate = useNavigate();
  const orderQuery = useServiceOrder(serviceOrderId ?? '');
  const diagnosticQuery = useServiceDiagnosticByOrder(serviceOrderId ?? '');
  const createMutation = useCreateServiceDiagnostic();

  const handleSubmit = async (values: DiagnosticFormSubmitValues) => {
    if (!serviceOrderId) return;
    try {
      const diagnostic = await createMutation.mutateAsync({
        serviceOrderId,
        generalObservation: values.generalObservation,
        recommendation: values.recommendation,
        items: values.items.map(toItemPayload)
      });
      toast.success('Diagnóstico técnico creado correctamente');
      void navigate(`/service-orders/${diagnostic.serviceOrderId}/diagnostic`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (orderQuery.isLoading || diagnosticQuery.isLoading) return <LoadingState />;
  if (orderQuery.isError) return <ErrorState message={getErrorMessage(orderQuery.error)} />;
  if (!orderQuery.data || !serviceOrderId) return <ErrorState message="Orden no encontrada" />;

  if (diagnosticQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Diagnóstico ya registrado" description={`La orden ${orderQuery.data.orderNumber} ya tiene un diagnóstico activo.`} />
        <Button>
          <Link to={`/service-orders/${serviceOrderId}/diagnostic`}>Ver diagnóstico</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuevo diagnóstico técnico"
        description={`${orderQuery.data.orderNumber} · ${orderQuery.data.vehicle.plate} · ${orderQuery.data.vehicle.displayName}`}
        action={
          <Button variant="secondary">
            <Link to={`/service-orders/${serviceOrderId}`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a la orden
            </Link>
          </Button>
        }
      />
      <DiagnosticForm isSubmitting={createMutation.isPending} onSubmit={handleSubmit} />
    </div>
  );
}
