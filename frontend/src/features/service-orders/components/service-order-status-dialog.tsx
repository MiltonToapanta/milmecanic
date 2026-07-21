import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, ClipboardList, Gauge, ShieldCheck, Wrench, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { serviceOrderStatusOptions } from '../../../config/catalogs';
import { cn } from '../../../lib/utils';
import type { ServiceOrder, ServiceOrderStatus } from '../types/service-order.types';
import { ServiceOrderStatusBadge } from './service-order-status-badge';

interface ServiceOrderStatusDialogProps {
  serviceOrder: ServiceOrder;
  onCancel: () => void;
  onConfirm: (status: ServiceOrderStatus, cancellationReason?: string) => void;
}

const nextStatus: Partial<Record<ServiceOrderStatus, ServiceOrderStatus>> = {
  RECEIVED: 'DIAGNOSIS',
  DIAGNOSIS: 'WAITING_APPROVAL',
  WAITING_APPROVAL: 'APPROVED',
  APPROVED: 'IN_REPAIR',
  IN_REPAIR: 'QUALITY_CONTROL',
  QUALITY_CONTROL: 'READY_FOR_DELIVERY',
  READY_FOR_DELIVERY: 'DELIVERED'
};

const statusIcons: Record<ServiceOrderStatus, React.ReactNode> = {
  RECEIVED: <ClipboardList className="h-5 w-5" />,
  DIAGNOSIS: <Gauge className="h-5 w-5" />,
  WAITING_APPROVAL: <AlertTriangle className="h-5 w-5" />,
  APPROVED: <ClipboardCheck className="h-5 w-5" />,
  IN_REPAIR: <Wrench className="h-5 w-5" />,
  QUALITY_CONTROL: <ShieldCheck className="h-5 w-5" />,
  READY_FOR_DELIVERY: <CheckCircle2 className="h-5 w-5" />,
  DELIVERED: <CheckCircle2 className="h-5 w-5" />,
  CANCELLED: <XCircle className="h-5 w-5" />
};

function getAllowedStatuses(status: ServiceOrderStatus): ServiceOrderStatus[] {
  const next = nextStatus[status];
  if (status === 'DELIVERED' || status === 'CANCELLED') return [];
  return next ? [next, 'CANCELLED'] : ['CANCELLED'];
}

export function ServiceOrderStatusDialog({ serviceOrder, onCancel, onConfirm }: ServiceOrderStatusDialogProps) {
  const allowedStatuses = useMemo(() => getAllowedStatuses(serviceOrder.status), [serviceOrder.status]);
  const [selectedStatus, setSelectedStatus] = useState<ServiceOrderStatus | ''>(allowedStatuses[0] ?? '');
  const [reason, setReason] = useState('');
  const isCancellation = selectedStatus === 'CANCELLED';
  const canSubmit = Boolean(selectedStatus) && (!isCancellation || reason.trim().length >= 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <section className="w-full max-w-3xl rounded-lg border border-border bg-card p-5 shadow-lg">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Cambiar estado de la orden</h2>
            <p className="mt-2 text-sm text-muted-foreground">{serviceOrder.orderNumber} · {serviceOrder.vehicle.plate} · {serviceOrder.customer.displayName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Actual</span>
            <ServiceOrderStatusBadge status={serviceOrder.status} />
          </div>
        </div>

        {allowedStatuses.length === 0 ? (
          <div className="mt-5 rounded-lg border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
            Esta orden ya está en un estado final. No hay más cambios disponibles.
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {serviceOrderStatusOptions.filter((option) => allowedStatuses.includes(option.value)).map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn('rounded-lg border border-border bg-background p-4 text-left shadow-sm transition hover:border-primary', selectedStatus === option.value && 'border-primary ring-2 ring-primary/30')}
                onClick={() => setSelectedStatus(option.value)}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-primary">{statusIcons[option.value]}</div>
                  {selectedStatus === option.value ? <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">Seleccionado</span> : null}
                </div>
                <p className="font-semibold">{option.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </div>
        )}

        {isCancellation ? (
          <label className="mt-4 block space-y-2">
            <span className="text-sm font-medium">Motivo de cancelación</span>
            <textarea className="mm-textarea" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ejemplo: el cliente no autoriza continuar con la reparación." />
            {reason.trim().length < 3 ? <span className="text-xs text-red-600">Ingrese al menos 3 caracteres.</span> : null}
          </label>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>Volver</Button>
          <Button disabled={!canSubmit} onClick={() => selectedStatus && onConfirm(selectedStatus, isCancellation ? reason.trim() : undefined)}>Guardar estado</Button>
        </div>
      </section>
    </div>
  );
}
