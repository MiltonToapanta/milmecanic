import { Save, X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '../../../components/forms/FormField';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  categoryLabels,
  diagnosticCategories,
  diagnosticItemStatuses,
  diagnosticSeverities,
  severityLabels,
  statusLabels
} from '../schemas/service-diagnostic.schema';
import type { DiagnosticCategory, DiagnosticItemStatus, DiagnosticSeverity, EditableDiagnosticItem } from '../types/service-diagnostic.types';

interface DiagnosticItemFormProps {
  item?: EditableDiagnosticItem;
  onSave: (item: EditableDiagnosticItem) => void;
  onCancel: () => void;
}

type DiagnosticItemFormValues = Omit<EditableDiagnosticItem, 'category' | 'status' | 'severity'> & {
  category: DiagnosticCategory | '';
  status: DiagnosticItemStatus | '';
  severity?: DiagnosticSeverity | '';
};

function createEmptyItem(): DiagnosticItemFormValues {
  return {
    localId: crypto.randomUUID(),
    category: '',
    itemName: '',
    status: '',
    observation: '',
    severity: ''
  };
}

function toFormValues(item?: EditableDiagnosticItem): DiagnosticItemFormValues {
  if (!item) return createEmptyItem();
  return {
    ...item,
    severity: item.severity ?? ''
  };
}

export function DiagnosticItemForm({ item, onSave, onCancel }: DiagnosticItemFormProps) {
  const form = useForm<DiagnosticItemFormValues>({
    defaultValues: toFormValues(item)
  });
  const status = form.watch('status');

  useEffect(() => {
    form.reset(toFormValues(item));
  }, [form, item]);

  useEffect(() => {
    if (status === 'GOOD' || status === 'NOT_CHECKED') form.setValue('severity', '');
  }, [form, status]);

  const submit = form.handleSubmit((values) => {
    form.clearErrors();
    if (!values.category) {
      form.setError('category', { message: 'Seleccione una categoría' });
      return;
    }
    if (!values.itemName.trim()) {
      form.setError('itemName', { message: 'Ingrese el elemento revisado' });
      return;
    }
    if (!values.status) {
      form.setError('status', { message: 'Seleccione un estado' });
      return;
    }
    if (values.status === 'BAD' && !values.observation?.trim()) {
      form.setError('observation', { message: 'La observación es obligatoria cuando el estado es Malo' });
      return;
    }
    if (values.status === 'BAD' && !values.severity) {
      form.setError('severity', { message: 'La severidad es obligatoria cuando el estado es Malo' });
      return;
    }

    const savedItem: EditableDiagnosticItem = {
      id: values.id,
      localId: values.localId,
      category: values.category,
      status: values.status,
      itemName: values.itemName.trim(),
      observation: values.observation?.trim() || undefined,
      severity: values.severity || undefined
    };
    onSave(savedItem);
  });

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{item ? 'Editar ítem' : 'Agregar ítem revisado'}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Registre una pieza o sistema específico. Ejemplo: Pastillas delanteras, aceite de motor, batería, luces bajas.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-5">
        <input type="hidden" {...form.register('localId')} />
        <FormField label="Categoría" error={form.formState.errors.category?.message}>
          <select className="mm-select" {...form.register('category')}>
            <option value="">Seleccione categoría</option>
            {diagnosticCategories.map((category) => (
              <option key={category} value={category}>{categoryLabels[category]}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Elemento revisado" error={form.formState.errors.itemName?.message}>
          <Input {...form.register('itemName')} placeholder="Ej. Pastillas delanteras" />
        </FormField>
        <FormField label="Estado" error={form.formState.errors.status?.message}>
          <select className="mm-select" {...form.register('status')}>
            <option value="">Seleccione estado</option>
            {diagnosticItemStatuses.map((itemStatus) => (
              <option key={itemStatus} value={itemStatus}>{statusLabels[itemStatus]}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Severidad" error={form.formState.errors.severity?.message} helper={status === 'BAD' ? 'Obligatoria si está Malo.' : 'Opcional.'}>
          <select className="mm-select" {...form.register('severity')} disabled={status === 'GOOD' || status === 'NOT_CHECKED'}>
            <option value="">Sin severidad</option>
            {diagnosticSeverities.map((severity) => (
              <option key={severity} value={severity}>{severityLabels[severity]}</option>
            ))}
          </select>
        </FormField>
        <div className="flex items-end gap-2">
          <Button type="button" className="w-full" onClick={() => void submit()}><Save className="h-4 w-4" />Guardar ítem</Button>
          <Button type="button" variant="secondary" onClick={onCancel}><X className="h-4 w-4" /></Button>
        </div>
        <div className="lg:col-span-5">
          <FormField label="Observación" error={form.formState.errors.observation?.message} helper={status === 'BAD' ? 'Explique la falla encontrada.' : 'Opcional: detalle útil para el cliente o asesor.'}>
            <textarea className="mm-textarea min-h-24" {...form.register('observation')} placeholder="Ej. Material de fricción bajo el mínimo recomendado." />
          </FormField>
        </div>
      </div>
    </div>
  );
}
