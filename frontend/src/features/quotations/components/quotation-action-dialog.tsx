import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { formatCurrency } from './quotation-helpers';

type QuotationAction = 'send' | 'approve' | 'reject' | 'cancel' | 'delete';

interface QuotationActionDialogProps {
  action: QuotationAction;
  quotationNumber: string;
  total?: number;
  customerName?: string;
  onConfirm: (rejectionReason?: string) => void;
  onCancel: () => void;
}

export function QuotationActionDialog({
  action,
  quotationNumber,
  total,
  customerName,
  onConfirm,
  onCancel
}: QuotationActionDialogProps) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  const actionLabels: Record<QuotationAction, { title: string; confirm: string; variant: 'primary' | 'secondary' | 'ghost' | 'danger' }> = {
    send: { title: 'Enviar cotización', confirm: 'Enviar', variant: 'primary' },
    approve: { title: 'Aprobar cotización', confirm: 'Aprobar', variant: 'primary' },
    reject: { title: 'Rechazar cotización', confirm: 'Rechazar', variant: 'danger' },
    cancel: { title: 'Cancelar cotización', confirm: 'Cancelar cotización', variant: 'danger' },
    delete: { title: 'Eliminar cotización', confirm: 'Eliminar', variant: 'danger' }
  };

  const messages: Record<QuotationAction, string> = {
    send: `¿Está seguro de enviar la cotización ${quotationNumber}? Una vez enviada, ya no podrá editarse.`,
    approve: `¿Está seguro de aprobar la cotización ${quotationNumber}?`,
    reject: `Rechazar la cotización ${quotationNumber}. Debe indicar el motivo del rechazo.`,
    cancel: `¿Está seguro de cancelar la cotización ${quotationNumber}? Esta acción no se puede deshacer.`,
    delete: `¿Está seguro de eliminar la cotización ${quotationNumber}? La eliminación es lógica y solo es posible en estado borrador.`
  };

  const handleConfirm = () => {
    if (action === 'reject') {
      if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
        setError('El motivo del rechazo es obligatorio (mínimo 5 caracteres)');
        return;
      }
      onConfirm(rejectionReason.trim());
    } else {
      onConfirm();
    }
  };

  return (
    <div className="rounded-md border border-border bg-card p-5 space-y-4">
      <h3 className="text-base font-semibold">{actionLabels[action].title}</h3>
      <p className="text-sm text-muted-foreground">{messages[action]}</p>

      {total !== undefined && (
        <p className="text-sm">
          Total: <span className="font-bold">{formatCurrency(total)}</span>
        </p>
      )}
      {customerName && (
        <p className="text-sm">
          Cliente: <span className="font-medium">{customerName}</span>
        </p>
      )}

      {action === 'send' && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠ Después de enviar, no podrá modificar la cotización.
        </p>
      )}

      {action === 'reject' && (
        <div>
          <label className="mb-1 block text-xs font-medium">Motivo del rechazo</label>
          <Input
            value={rejectionReason}
            onChange={(e) => { setRejectionReason(e.target.value); setError(''); }}
            placeholder="Explique el motivo del rechazo..."
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant={actionLabels[action].variant === 'danger' ? 'danger' : 'primary'} onClick={handleConfirm}>
          {actionLabels[action].confirm}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
