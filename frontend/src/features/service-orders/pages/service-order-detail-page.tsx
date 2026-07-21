import { AxiosError } from 'axios';
import { Camera, Edit, Printer, RefreshCcw, Trash2, Upload } from 'lucide-react';
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
import { apiClient } from '../../../services/api-client';
import { useAuthStore } from '../../auth/store/auth.store';
import { ServiceOrderStatusBadge } from '../components/service-order-status-badge';
import { ServiceOrderStatusDialog } from '../components/service-order-status-dialog';
import { useChangeServiceOrderStatus, useDeleteServiceOrder, useServiceOrder, useUploadServiceOrderPhoto } from '../hooks/use-service-orders';
import type { ServiceOrder, ServiceOrderStatus } from '../types/service-order.types';
import { useEffect, useState } from 'react';

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

function PhotoPreview({ url, alt }: { url: string; alt: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | undefined;
    let active = true;
    void apiClient.get<Blob>(url, { responseType: 'blob' }).then((response) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(response.data);
      setSrc(objectUrl);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (!src) return <div className="flex aspect-video items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">Cargando foto...</div>;
  return <img className="aspect-video w-full rounded-md object-cover" src={src} alt={alt} />;
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
  const uploadPhotoMutation = useUploadServiceOrderPhoto();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');

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
            <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimir orden</Button>
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
          'Use Imprimir orden para generar el documento que firman cliente y taller.'
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

      <section className="grid gap-4 lg:grid-cols-3">
        <TextBlock title="Condición exterior" value={order.exteriorCondition} />
        <TextBlock title="Condición interior" value={order.interiorCondition} />
        <TextBlock title="Accesorios recibidos" value={order.receivedAccessories} />
      </section>

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Fotos de recepción</h2>
            <p className="mt-1 text-sm text-muted-foreground">Suba fotos del estado del vehículo al ingresar al taller.</p>
          </div>
          {hasPermission('service-orders.update') && canModify ? (
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
              <Upload className="h-4 w-4" />
              Subir foto
              <input
                className="hidden"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void runAction(async () => {
                    await uploadPhotoMutation.mutateAsync({ id: order.id, file, caption: photoCaption || undefined });
                    setPhotoCaption('');
                    event.target.value = '';
                  }, 'Foto agregada a la orden');
                }}
              />
            </label>
          ) : null}
        </div>
        {hasPermission('service-orders.update') && canModify ? (
          <input
            className="mt-4 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/30"
            value={photoCaption}
            onChange={(event) => setPhotoCaption(event.target.value)}
            placeholder="Descripción opcional antes de subir: frente, lateral derecho, tablero..."
          />
        ) : null}
        {order.photos.length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <Camera className="mx-auto mb-2 h-7 w-7" />
            Aún no hay fotos en esta orden.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {order.photos.map((photo) => (
              <div key={photo.id} className="rounded-lg border border-border bg-background p-3">
                <PhotoPreview url={photo.url} alt={photo.caption || photo.originalName} />
                <p className="truncate text-sm font-semibold">{photo.caption || photo.originalName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{(photo.size / 1024).toFixed(1)} KB · {formatDateTime(photo.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Documento de orden para firma</h2>
            <p className="mt-1 text-sm text-muted-foreground">Vista imprimible para que firmen cliente y taller al recibir el vehículo.</p>
          </div>
          <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimir</Button>
        </div>
        <div className="mt-6 rounded-lg border border-border bg-background p-5 text-sm">
          <div className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-semibold">Orden de servicio {order.orderNumber}</h3>
              <p className="text-muted-foreground">MilMecanic - Gestión inteligente para talleres</p>
            </div>
            <ServiceOrderStatusBadge status={order.status} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <p><strong>Cliente:</strong> {order.customer.displayName} - {order.customer.identification}</p>
            <p><strong>Vehículo:</strong> {order.vehicle.plate} - {order.vehicle.displayName}</p>
            <p><strong>Kilometraje:</strong> {order.reportedMileage.toLocaleString('es-EC')} km</p>
            <p><strong>Combustible:</strong> {fuelLevelOptions.find((option) => option.value === order.fuelLevel)?.label ?? order.fuelLevel}</p>
            <p><strong>Fecha:</strong> {formatDateTime(order.createdAt)}</p>
            <p><strong>Entrega estimada:</strong> {formatDateTime(order.estimatedDeliveryAt)}</p>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <TextBlock title="Solicitud del cliente" value={order.customerRequest} />
            <TextBlock title="Condición recibida" value={[order.exteriorCondition, order.interiorCondition, order.receivedAccessories].filter(Boolean).join('\n')} />
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="border-t border-foreground pt-3 text-center">
              <p className="font-semibold">{order.customerSignatureName || order.customer.displayName}</p>
              <p className="text-xs text-muted-foreground">Firma cliente</p>
            </div>
            <div className="border-t border-foreground pt-3 text-center">
              <p className="font-semibold">{order.workshopSignatureName || order.assignedAdvisor?.displayName || 'MilMecanic Taller'}</p>
              <p className="text-xs text-muted-foreground">Firma taller</p>
            </div>
          </div>
        </div>
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
