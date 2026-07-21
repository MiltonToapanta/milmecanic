import { AxiosError } from 'axios';
import { CheckCircle2, ClipboardCheck, Edit, FileText, Image as ImageIcon, Paperclip, Printer, RefreshCcw, ShieldAlert, Trash2, Upload } from 'lucide-react';
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
import { DiagnosticStatusBadge } from '../../service-diagnostics/components/diagnostic-status-badge';
import { useServiceDiagnosticByOrder } from '../../service-diagnostics/hooks/use-service-diagnostics';
import type { ServiceDiagnostic } from '../../service-diagnostics/types/service-diagnostic.types';
import { getDiagnosticSummary } from '../../service-diagnostics/utils/diagnostic-summary';
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
  const diagnosticQuery = useServiceDiagnosticByOrder(id ?? '');
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

      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Diagnóstico técnico
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Registre la revisión del mecánico por categorías: motor, frenos, luces, neumáticos y más.
            </p>
          </div>
          {diagnosticQuery.data ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">
                <Link to={`/service-orders/${order.id}/diagnostic`}>Ver diagnóstico</Link>
              </Button>
              {!diagnosticQuery.data.completedAt && hasPermission('service-diagnostics.update') ? (
                <Button variant="secondary">
                  <Link to={`/service-orders/${order.id}/diagnostic/edit`} className="flex items-center gap-2">
                    <Edit className="h-4 w-4" />
                    Editar
                  </Link>
                </Button>
              ) : null}
            </div>
          ) : hasPermission('service-diagnostics.create') && canModify ? (
            <Button>
              <Link to={`/service-orders/${order.id}/diagnostic/new`} className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Crear diagnóstico
              </Link>
            </Button>
          ) : null}
        </div>

        {diagnosticQuery.isLoading ? (
          <div className="mt-4 rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">Consultando diagnóstico...</div>
        ) : diagnosticQuery.data ? (
          <DiagnosticOrderSummary diagnostic={diagnosticQuery.data} />
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-border bg-background p-5">
            <div className="flex gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">Aún no se ha registrado un diagnóstico técnico.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cuando la orden esté en etapa de diagnóstico, registre los ítems revisados y las fallas encontradas.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

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
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Paperclip className="h-5 w-5 text-primary" />
              Adjuntos de recepción
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Agregue fotos como evidencia adjunta del estado del vehículo al ingresar al taller.</p>
          </div>
          {hasPermission('service-orders.update') && canModify ? (
            <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
              <Upload className="h-4 w-4" />
              Agregar adjunto
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
            placeholder="Descripción del adjunto: frente, lateral derecho, tablero, rayón, golpe..."
          />
        ) : null}
        {order.photos.length === 0 ? (
          <div className="mt-4 rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <Paperclip className="mx-auto mb-2 h-7 w-7" />
            Aún no hay adjuntos en esta orden.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {order.photos.map((photo) => (
              <div key={photo.id} className="rounded-lg border border-border bg-background p-3">
                <PhotoPreview url={photo.url} alt={photo.caption || photo.originalName} />
                <div className="mt-3 flex items-start gap-2">
                  <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{photo.caption || photo.originalName}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Adjunto fotográfico · {(photo.size / 1024).toFixed(1)} KB · {formatDateTime(photo.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="print-hide flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Documento de orden para firma</h2>
            <p className="mt-1 text-sm text-muted-foreground">Vista imprimible para que firmen cliente y taller al recibir el vehículo.</p>
          </div>
          <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimir</Button>
        </div>
        <div className="print-document mt-6 overflow-hidden rounded-xl border border-border bg-white text-sm shadow-sm">
          <div className="border-b-4 border-primary bg-white px-7 py-6 text-slate-950">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-primary-foreground shadow-sm">MM</div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-primary">MilMecanic Taller</p>
                  <h3 className="mt-1 text-3xl font-black tracking-tight">Acta de recepción</h3>
                  <p className="mt-1 text-base font-semibold text-slate-600">Orden de servicio y constancia de ingreso del vehículo</p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 text-left sm:text-right">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Orden No.</p>
                <p className="mt-1 text-3xl font-black text-slate-950">{order.orderNumber}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">{formatDateTime(order.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-7">
            <div className="grid gap-3 md:grid-cols-4">
              <PrintInfoCard title="Estado" value={<ServiceOrderStatusBadge status={order.status} />} />
              <PrintInfoCard title="Asesor" value={order.assignedAdvisor?.displayName ?? 'Sin asesor'} />
              <PrintInfoCard title="Mecánico" value={order.assignedMechanic?.displayName ?? 'Sin mecánico'} />
              <PrintInfoCard title="Adjuntos" value={`${order.photos.length} archivo${order.photos.length === 1 ? '' : 's'}`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="print-card rounded-xl border border-slate-200 bg-white p-5">
                <h4 className="flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-black uppercase tracking-wide text-slate-700">
                  <FileText className="h-4 w-4 text-primary" />
                  Datos del cliente
                </h4>
                <div className="mt-3 grid gap-2 text-sm">
                  <PrintLine label="Cliente" value={order.customer.displayName} />
                  <PrintLine label="Identificación" value={order.customer.identification} />
                  <PrintLine label="Firma sugerida" value={order.customerSignatureName || order.customer.displayName} />
                </div>
              </div>

              <div className="print-card rounded-xl border border-slate-200 bg-white p-5">
                <h4 className="flex items-center gap-2 border-b border-slate-200 pb-2 text-sm font-black uppercase tracking-wide text-slate-700">
                  <FileText className="h-4 w-4 text-primary" />
                  Datos del vehículo
                </h4>
                <div className="mt-3 grid gap-2 text-sm">
                  <PrintLine label="Placa" value={order.vehicle.plate} />
                  <PrintLine label="Vehículo" value={order.vehicle.displayName} />
                  <PrintLine label="Kilometraje" value={`${order.reportedMileage.toLocaleString('es-EC')} km`} />
                  <PrintLine label="Combustible" value={fuelLevelOptions.find((option) => option.value === order.fuelLevel)?.label ?? order.fuelLevel} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <PrintTextCard title="Solicitud del cliente" value={order.customerRequest} />
              <PrintTextCard title="Diagnóstico inicial" value={order.initialDiagnosis} />
            </div>

            <div className="print-card rounded-xl border border-slate-200 bg-white p-5">
              <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">Condición de recepción</h4>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <PrintMiniText title="Exterior" value={order.exteriorCondition} />
                <PrintMiniText title="Interior" value={order.interiorCondition} />
                <PrintMiniText title="Accesorios" value={order.receivedAccessories} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <PrintInfoCard title="Entrega estimada" value={formatDateTime(order.estimatedDeliveryAt)} />
              <PrintInfoCard title="Inicio de trabajo" value={formatDateTime(order.startedAt)} />
              <PrintInfoCard title="Finalización" value={formatDateTime(order.completedAt)} />
            </div>

            {order.photos.length > 0 ? (
              <div className="print-card rounded-xl border border-slate-200 bg-white p-5">
                <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
                  <Paperclip className="h-4 w-4 text-primary" />
                  Anexos fotográficos
                </h4>
                <p className="mt-1 text-xs text-slate-500">Evidencia adjunta registrada durante la recepción de la orden.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {order.photos.map((photo, index) => (
                    <div key={photo.id} className="rounded-lg border border-slate-200 p-2">
                      <PhotoPreview url={photo.url} alt={photo.caption || photo.originalName} />
                      <p className="mt-2 text-xs font-bold text-slate-800">Adjunto {index + 1}</p>
                      <p className="text-[11px] leading-4 text-slate-500">{photo.caption || photo.originalName}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="print-card rounded-xl border border-slate-200 bg-slate-50 p-5 text-xs leading-5 text-slate-600">
              <h4 className="text-sm font-black uppercase tracking-wide text-slate-700">Constancia y autorización</h4>
              <p className="mt-2">
                El cliente autoriza la recepción del vehículo para inspección y diagnóstico inicial. Cualquier reparación, repuesto o trabajo adicional
                deberá ser informado y aprobado antes de su ejecución. El taller registra las condiciones visibles indicadas en esta orden.
              </p>
            </div>

            <div className="grid gap-10 pt-10 md:grid-cols-2">
              <div className="border-t-2 border-slate-800 pt-3 text-center">
                <p className="font-bold text-slate-900">{order.customerSignatureName || order.customer.displayName}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Firma cliente</p>
              </div>
              <div className="border-t-2 border-slate-800 pt-3 text-center">
                <p className="font-bold text-slate-900">{order.workshopSignatureName || order.assignedAdvisor?.displayName || 'MilMecanic Taller'}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Firma taller</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 text-center text-[11px] text-slate-500">
              Documento generado por MilMecanic ERP · {formatDateTime(new Date().toISOString())}
            </div>
          </div>
        </div>
        <div className="hidden">
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

function PrintInfoCard({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <div className="print-card rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value || 'Sin registrar'}</div>
    </div>
  );
}

function PrintLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-100 pb-1">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="text-right font-semibold text-slate-900">{value || 'Sin registrar'}</span>
    </div>
  );
}

function PrintTextCard({ title, value }: { title: string; value?: string | null }) {
  return (
    <div className="print-card rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-bold uppercase tracking-wide text-slate-700">{title}</h4>
      <p className="mt-3 min-h-20 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">{value || 'Sin registrar'}</p>
    </div>
  );
}

function PrintMiniText({ title, value }: { title: string; value?: string | null }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 whitespace-pre-line text-sm leading-5 text-slate-700">{value || 'Sin registrar'}</p>
    </div>
  );
}

function DiagnosticOrderSummary({ diagnostic }: { diagnostic: ServiceDiagnostic }) {
  const summary = getDiagnosticSummary(diagnostic.items);
  return (
    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      <DetailItem label="Estado" value={<DiagnosticStatusBadge diagnostic={diagnostic} />} />
      <DetailItem label="Ítems revisados" value={summary.total} />
      <DetailItem label="Fallas detectadas" value={<span className="inline-flex items-center gap-1"><ShieldAlert className="h-4 w-4 text-red-600" />{summary.bad}</span>} />
      <DetailItem label="Fecha de creación" value={formatDateTime(diagnostic.createdAt)} />
      <DetailItem
        label="Finalización"
        value={diagnostic.completedAt ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{formatDateTime(diagnostic.completedAt)}</span> : 'Pendiente'}
      />
    </div>
  );
}
