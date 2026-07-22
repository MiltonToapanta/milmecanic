import { AxiosError } from 'axios';
import { ArrowLeft, Edit, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageHeader } from '../../../components/common/PageHeader';
import { ErrorState } from '../../../components/feedback/ErrorState';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../auth/store/auth.store';
import { useApproveQuotation, useCancelQuotation, useDeleteQuotation, useQuotation, useRejectQuotation, useSendQuotation, useAddQuotationItem, useUpdateQuotationItem, useDeleteQuotationItem } from '../hooks/use-quotations';
import type { CreateQuotationItemInput, Quotation } from '../types/quotation.types';
import { QuotationActionDialog } from '../components/quotation-action-dialog';
import { formatCurrency, formatOptionalDate } from '../components/quotation-helpers';
import { QuotationItemForm } from '../components/quotation-item-form';
import { QuotationItemsTable } from '../components/quotation-items-table';
import { QuotationStatusBadge } from '../components/quotation-status-badge';
import { QuotationSummary } from '../components/quotation-summary';
import { Plus } from 'lucide-react';

function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return (error.response?.data as { message?: string })?.message ?? 'Error al realizar la operación';
  }
  return 'Error al realizar la operación';
}

export function QuotationDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const quotationQuery = useQuotation(id!);
  const sendMutation = useSendQuotation();
  const approveMutation = useApproveQuotation();
  const rejectMutation = useRejectQuotation();
  const cancelMutation = useCancelQuotation();
  const deleteMutation = useDeleteQuotation();
  const addItemMutation = useAddQuotationItem();
  const updateItemMutation = useUpdateQuotationItem();
  const deleteItemMutation = useDeleteQuotationItem();

  const [actionType, setActionType] = useState<'send' | 'approve' | 'reject' | 'cancel' | 'delete' | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<{ id: string; index: number } | null>(null);

  if (quotationQuery.isLoading) return <LoadingState />;
  if (quotationQuery.isError || !quotationQuery.data) {
    return <ErrorState message="No se pudo cargar la cotización" />;
  }

  const quotation = quotationQuery.data;
  const isDraft = quotation.status === 'DRAFT';
  const isSent = quotation.status === 'SENT';
  const isApproved = quotation.status === 'APPROVED';

  const handleAction = async (rejectionReason?: string) => {
    try {
      switch (actionType) {
        case 'send':
          await sendMutation.mutateAsync(id!);
          toast.success('Cotización enviada');
          break;
        case 'approve':
          await approveMutation.mutateAsync(id!);
          toast.success('Cotización aprobada');
          break;
        case 'reject':
          if (rejectionReason) {
            await rejectMutation.mutateAsync({ id: id!, rejectionReason });
            toast.success('Cotización rechazada');
          }
          break;
        case 'cancel':
          await cancelMutation.mutateAsync(id!);
          toast.success('Cotización cancelada');
          break;
        case 'delete':
          await deleteMutation.mutateAsync(id!);
          toast.success('Cotización eliminada');
          navigate('/quotations');
          return;
      }
      await quotationQuery.refetch();
      setActionType(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setActionType(null);
    }
  };

  const handleAddItem = async (item: CreateQuotationItemInput) => {
    try {
      if (editingItem) {
        await updateItemMutation.mutateAsync({ id: id!, itemId: editingItem.id, payload: item });
        toast.success('Ítem actualizado');
      } else {
        await addItemMutation.mutateAsync({ id: id!, payload: item });
        toast.success('Ítem agregado');
      }
      await quotationQuery.refetch();
      setShowItemForm(false);
      setEditingItem(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteItem = async (index: number) => {
    const item = quotation.items[index];
    if (!item) return;
    try {
      await deleteItemMutation.mutateAsync({ id: id!, itemId: item.id });
      toast.success('Ítem eliminado');
      await quotationQuery.refetch();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Cotización ${quotation.quotationNumber}`}
        action={
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => navigate('/quotations')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
            <Link to={`/service-orders/${quotation.serviceOrderId}`}>
              <Button variant="secondary">
                <ExternalLink className="mr-2 h-4 w-4" /> Ver orden
              </Button>
            </Link>
          </div>
        }
      />

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-border p-4">
          <p className="text-xs text-muted-foreground">Estado</p>
          <QuotationStatusBadge status={quotation.status} />
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs text-muted-foreground">Fecha creación</p>
          <p className="font-medium">{formatOptionalDate(quotation.createdAt)}</p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs text-muted-foreground">Vigencia</p>
          <p className="font-medium">{formatOptionalDate(quotation.validUntil)}</p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold">{formatCurrency(quotation.total)}</p>
        </div>
      </div>

      {/* Service Order + Customer + Vehicle */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-border p-4">
          <p className="text-xs text-muted-foreground">Orden de servicio</p>
          <Link to={`/service-orders/${quotation.serviceOrderId}`} className="font-medium text-primary hover:underline">
            {quotation.serviceOrder.orderNumber}
          </Link>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs text-muted-foreground">Cliente</p>
          <p className="font-medium">{quotation.serviceOrder.customer.displayName}</p>
          <p className="text-xs text-muted-foreground">{quotation.serviceOrder.customer.identification}</p>
        </div>
        <div className="rounded-md border border-border p-4">
          <p className="text-xs text-muted-foreground">Vehículo</p>
          <p className="font-medium">{quotation.serviceOrder.vehicle.displayName}</p>
          <p className="text-xs text-muted-foreground">{quotation.serviceOrder.vehicle.plate}</p>
        </div>
      </div>

      {/* Notes */}
      {quotation.notes && (
        <div className="rounded-md border border-border p-4">
          <p className="text-xs text-muted-foreground">Notas</p>
          <p className="text-sm">{quotation.notes}</p>
        </div>
      )}

      {/* Approval / Rejection info */}
      {quotation.approvedAt && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Aprobada el {formatOptionalDate(quotation.approvedAt)}</p>
        </div>
      )}
      {quotation.rejectedAt && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
          <p className="text-sm font-medium text-red-700 dark:text-red-300">Rechazada el {formatOptionalDate(quotation.rejectedAt)}</p>
          {quotation.rejectionReason && <p className="mt-1 text-sm text-red-600 dark:text-red-400">Motivo: {quotation.rejectionReason}</p>}
        </div>
      )}

      {/* Items */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Ítems</h3>
          {isDraft && hasPermission('quotations.update') && !showItemForm && (
            <Button variant="secondary" onClick={() => { setEditingItem(null); setShowItemForm(true); }}>
              <Plus className="mr-1 h-4 w-4" /> Agregar ítem
            </Button>
          )}
        </div>

        {showItemForm && isDraft && (
          <div className="mb-4">
            <QuotationItemForm
              onSave={handleAddItem}
              onCancel={() => { setShowItemForm(false); setEditingItem(null); }}
            />
          </div>
        )}

        <QuotationItemsTable items={quotation.items} readonly />

        <div className="mt-4 max-w-sm">
          <QuotationSummary
            subtotal={quotation.subtotal}
            discount={quotation.discount}
            tax={quotation.tax}
            total={quotation.total}
          />
        </div>
      </div>

      {/* Actions */}
      {actionType && (
        <QuotationActionDialog
          action={actionType}
          quotationNumber={quotation.quotationNumber}
          total={quotation.total}
          customerName={quotation.serviceOrder.customer.displayName}
          onConfirm={handleAction}
          onCancel={() => setActionType(null)}
        />
      )}

      {!actionType && (
        <div className="flex flex-wrap gap-2">
          {isDraft && hasPermission('quotations.update') && (
            <Link to={`/quotations/${id}/edit`}>
              <Button variant="secondary"><Edit className="mr-2 h-4 w-4" /> Editar</Button>
            </Link>
          )}
          {isDraft && hasPermission('quotations.send') && (
            <Button onClick={() => setActionType('send')}>Enviar cotización</Button>
          )}
          {isSent && hasPermission('quotations.approve') && (
            <Button onClick={() => setActionType('approve')}>Aprobar</Button>
          )}
          {isSent && hasPermission('quotations.reject') && (
            <Button variant="danger" onClick={() => setActionType('reject')}>Rechazar</Button>
          )}
          {(isDraft || isSent) && hasPermission('quotations.cancel') && (
            <Button variant="danger" onClick={() => setActionType('cancel')}>Cancelar</Button>
          )}
          {isDraft && hasPermission('quotations.delete') && (
            <Button variant="danger" onClick={() => setActionType('delete')}>Eliminar</Button>
          )}
        </div>
      )}
    </div>
  );
}
