import { AxiosError } from 'axios';
import { Edit, RefreshCcw, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { fuelLevelOptions } from '../../../config/catalogs';
import { cn } from '../../../lib/utils';
import { useAuthStore } from '../../auth/store/auth.store';
import { ServiceOrderStatusBadge } from '../components/service-order-status-badge';
import { ServiceOrderStatusDialog } from '../components/service-order-status-dialog';
import { useChangeServiceOrderStatus, useDeleteServiceOrder, useServiceOrder } from '../hooks/use-service-orders';
import type { ServiceOrder, ServiceOrderStatus } from '../types/service-order.types';
import { useState } from 'react';

const progressSteps: Array<{ status: ServiceOrderStatus; label: string }> = [
  { status: 'RECEIVED', label: 'Recepción' },
  { status: 'DIAGNOSIS', label: 'Diagnóstico' },
  { status: 'WAITING_APPROVAL', label: 'Aprobación' },
  { status: 'IN_REPAIR', label: 'Reparación' },
  { status: 'QUALITY_CONTROL', label: 'Control de calidad' },
  { status: 'READY_FOR_DELIVERY', label: 'Listo' },
  { status: 'DELIVERED', label: 'Entregado' }
];

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const response = error.response?.data as { message?: string } | undefined;
    return response?.message ?? 'No se pudo completar la operación';
  }
  return 'No se pudo completar la operación';
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="mt-2 text-sm font-medium">{value || 'Sin registrar'}</div>
    </div>
  );
}

function ProgressLine({ order }: { order: ServiceOrder }) {
  if (order.status === 'CANCELLED') {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950">
        <h2 className="font-semibold">Orden cancelada</h2>
        <p className="mt-2 text-sm">{order.cancellationReason ?? 'No se registró motivo.'}</p>
      </section>
    );
  }
  const currentIndex = progressSteps.findIndex((step) => step.status === order.status);
  const approvedIndex = progressSteps.findIndex((step) => step.status === 'WAITING_APPROVAL');

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-base font-semibold">Progreso de la orden</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-7">
        {progressSteps.map((step, index) => {
          const effectiveIndex = order.status === 'APPROVED' ? approvedIndex : currentIndex;
          const active = index <= effectiveIndex;
          const current = index === effectiveIndex;
          return (
            <div key={step.status} className="flex items-center gap-2 md:block">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold md:mx-auto', active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-muted text-muted-foreground', current && 'ring-2 ring-primary/30')}>
                {index + 1}
              </div>
              <p className={cn('text-sm md:mt-2 md:text-center', active ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{step.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ServiceOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const orderQuery = useServiceOrder(id ?? '');
  const changeStatusMutation = useChangeServiceOrderStatus();
  const deleteMutation = useDeleteServiceOrder();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const order = orderQuery.data;
  const canModify = order ? order.status !== 'DELIVERED' && order.status !== 'CANCELLED' : false;

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action();
      toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  if (orderQuery.isLoading) return <LoadingState />;
  if (orderQuery.isError) return <ErrorState message={getErrorMessage(orderQuery.error)} />;
  if (!order) return <ErrorState message="Orden no encontrada" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.orderNumber}
        description={`${order.customer.displayName} · ${order.vehicle.plate} · ${order.vehicle.displayName}`}
        action={(
          <div className="flex flex-wrap gap-2">
            {hasPermission('service-orders.update') && canModify ? (
              <Button variant="secondary">
                <Link to={`/service-orders/${order.id}/edit`} className="flex items-center gap-2"><Edit className="h-4 w-4" />Editar</Link>
              </Button>
            ) : null}
            {hasPermission('service-orders.change-status') && canModify ? (
              <Button variant="secondary" onClick={() => setStatusDialogOpen(true)}><RefreshCcw className="h-4 w-4" />Cambiar estado</Button>
            ) : null}
            {hasPermission('service-orders.delete') ? (
              <Button variant="danger" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" />Eliminar</Button>
            ) : null}
          </div>
        )}
      />

      <HelpPanel
        title="Detalle de orden"
        items={[
          'Revise el estado actual y el progreso antes de avanzar.',
          'Los cambios de estado siguen el flujo del taller paso a paso.',
          'Si cancela, se solicitará un motivo obligatorio.',
          'Aquí todavía no se agregan repuestos, mano de obra ni documentos.'
        ]}
      />

      <ProgressLine order={order} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailItem label="Estado" value={<ServiceOrderStatusBadge status={order.status} />} />
        <DetailItem label="Fecha de creación" value={formatDateTime(order.createdAt)} />
        <DetailItem label="Cliente" value={<><p>{order.customer.displayName}</p><p className="text-xs text-muted-foreground">{order.customer.identification}</p></>} />
        <DetailItem label="Vehículo" value={<><p>{order.vehicle.plate}</p><p className="text-xs text-muted-foreground">{order.vehicle.displayName}</p></>} />
        <DetailItem label="Kilometraje" value={`${order.reportedMileage.toLocaleString('es-EC')} km`} />
        <DetailItem label="Combustible" value={fuelLevelOptions.find((option) => option.value === order.fuelLevel)?.label ?? order.fuelLevel} />
        <DetailItem label="Asesor" value={order.assignedAdvisor?.displayName} />
        <DetailItem label="Mecánico" value={order.assignedMechanic?.displayName} />
        <DetailItem label="Entrega estimada" value={formatDateTime(order.estimatedDeliveryAt)} />
        <DetailItem label="Inicio" value={formatDateTime(order.startedAt)} />
        <DetailItem label="Finalización" value={formatDateTime(order.completedAt)} />
        <DetailItem label="Entrega" value={formatDateTime(order.deliveredAt)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <TextBlock title="Solicitud del cliente" value={order.customerRequest} />
        <TextBlock title="Diagnóstico inicial" value={order.initialDiagnosis} />
        <TextBlock title="Notas internas" value={order.internalNotes} />
      </section>

      {order.cancellationReason ? <TextBlock title="Motivo de cancelación" value={order.cancellationReason} /> : null}

      {statusDialogOpen ? (
        <ServiceOrderStatusDialog
          serviceOrder={order}
          onCancel={() => setStatusDialogOpen(false)}
          onConfirm={(status, cancellationReason) => {
            void runAction(async () => {
              await changeStatusMutation.mutateAsync({ id: order.id, payload: { status, cancellationReason } });
              setStatusDialogOpen(false);
            }, 'Estado de la orden actualizado');
          }}
        />
      ) : null}

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md bg-card p-5 shadow-lg">
            <ConfirmDialog
              title={`¿Eliminar la orden ${order.orderNumber}? Esta acción será lógica.`}
              onConfirm={() => {
                void runAction(async () => {
                  await deleteMutation.mutateAsync(order.id);
                  void navigate('/service-orders');
                }, 'Orden eliminada');
              }}
            />
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TextBlock({ title, value }: { title: string; value?: string | null }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{value || 'Sin registrar'}</p>
    </section>
  );
}
