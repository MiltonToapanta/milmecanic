import { zodResolver } from '@hookform/resolvers/zod';
import { Save, X } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormField } from '../../../components/forms/FormField';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  categoryLabels,
  diagnosticCategories,
  diagnosticItemSchema,
  diagnosticItemStatuses,
  diagnosticSeverities,
  severityLabels,
  statusLabels
} from '../schemas/service-diagnostic.schema';
import type { EditableDiagnosticItem } from '../types/service-diagnostic.types';

interface DiagnosticItemFormProps {
  item?: EditableDiagnosticItem;
  onSave: (item: EditableDiagnosticItem) => void;
  onCancel: () => void;
}

function createEmptyItem(): EditableDiagnosticItem {
  return {
    localId: crypto.randomUUID(),
    category: 'ENGINE',
    itemName: '',
    status: 'GOOD',
    observation: '',
    severity: undefined
  };
}

export function DiagnosticItemForm({ item, onSave, onCancel }: DiagnosticItemFormProps) {
  const form = useForm<EditableDiagnosticItem>({
    resolver: zodResolver(diagnosticItemSchema),
    defaultValues: item ?? createEmptyItem()
  });
  const status = form.watch('status');

  useEffect(() => {
    form.reset(item ?? createEmptyItem());
  }, [form, item]);

  useEffect(() => {
    if (status === 'GOOD' || status === 'NOT_CHECKED') form.setValue('severity', undefined);
  }, [form, status]);

  const submit = form.handleSubmit((values) => {
    onSave({
      ...values,
      itemName: values.itemName.trim(),
      observation: values.observation?.trim() || undefined,
      severity: values.severity || undefined
    });
  });

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{item ? 'Editar ítem' : 'Agregar ítem revisado'}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Registre una pieza o sistema específico. Ejemplo: Pastillas delanteras, aceite de motor, batería, luces bajas.
        </p>
      </div>
      <form className="grid gap-4 lg:grid-cols-5" onSubmit={(event) => void submit(event)}>
        <input type="hidden" {...form.register('localId')} />
        <FormField label="Categoría" error={form.formState.errors.category?.message}>
          <select className="mm-select" {...form.register('category')}>
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
          <Button type="submit" className="w-full"><Save className="h-4 w-4" />Guardar ítem</Button>
          <Button type="button" variant="secondary" onClick={onCancel}><X className="h-4 w-4" /></Button>
        </div>
        <div className="lg:col-span-5">
          <FormField label="Observación" error={form.formState.errors.observation?.message} helper={status === 'BAD' ? 'Explique la falla encontrada.' : 'Opcional: detalle útil para el cliente o asesor.'}>
            <textarea className="mm-textarea min-h-24" {...form.register('observation')} placeholder="Ej. Material de fricción bajo el mínimo recomendado." />
          </FormField>
        </div>
      </form>
    </div>
  );
}
