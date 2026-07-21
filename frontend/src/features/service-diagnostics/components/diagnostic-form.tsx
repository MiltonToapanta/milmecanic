import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardCheck, Plus, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';
import { HelpPanel } from '../../../components/common/HelpPanel';
import { FormField } from '../../../components/forms/FormField';
import { Button } from '../../../components/ui/button';
import { serviceDiagnosticSchema, type ServiceDiagnosticFormValues } from '../schemas/service-diagnostic.schema';
import type { EditableDiagnosticItem, ServiceDiagnostic, ServiceDiagnosticItem } from '../types/service-diagnostic.types';
import { DiagnosticItemForm } from './diagnostic-item-form';
import { DiagnosticItemsTable } from './diagnostic-items-table';
import { DiagnosticSummary } from './diagnostic-summary';

export interface DiagnosticFormSubmitValues {
  generalObservation?: string;
  recommendation?: string;
  items: EditableDiagnosticItem[];
  deletedItemIds: string[];
}

interface DiagnosticFormProps {
  diagnostic?: ServiceDiagnostic | null;
  isSubmitting: boolean;
  onSubmit: (values: DiagnosticFormSubmitValues) => Promise<void>;
}

function toEditableItem(item: ServiceDiagnosticItem): EditableDiagnosticItem {
  return {
    id: item.id,
    localId: item.id,
    category: item.category,
    itemName: item.itemName,
    status: item.status,
    observation: item.observation ?? undefined,
    severity: item.severity ?? undefined
  };
}

function toSummaryItems(items: EditableDiagnosticItem[]): ServiceDiagnosticItem[] {
  const now = new Date().toISOString();
  return items.map((item) => ({
    id: item.id ?? item.localId,
    diagnosticId: '',
    category: item.category,
    itemName: item.itemName,
    status: item.status,
    observation: item.observation,
    severity: item.severity,
    createdAt: now,
    updatedAt: now
  }));
}

function trimOptional(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized || undefined;
}

export function DiagnosticForm({ diagnostic, isSubmitting, onSubmit }: DiagnosticFormProps) {
  const [items, setItems] = useState<EditableDiagnosticItem[]>(() => diagnostic?.items.map(toEditableItem) ?? []);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<EditableDiagnosticItem | undefined>();
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<EditableDiagnosticItem | null>(null);
  const form = useForm<Omit<ServiceDiagnosticFormValues, 'items'>>({
    resolver: zodResolver(serviceDiagnosticSchema.omit({ items: true })),
    defaultValues: {
      generalObservation: diagnostic?.generalObservation ?? '',
      recommendation: diagnostic?.recommendation ?? ''
    }
  });

  useEffect(() => {
    form.reset({
      generalObservation: diagnostic?.generalObservation ?? '',
      recommendation: diagnostic?.recommendation ?? ''
    });
    setItems(diagnostic?.items.map(toEditableItem) ?? []);
    setDeletedItemIds([]);
    setEditingItem(undefined);
    setItemFormOpen(false);
  }, [diagnostic, form]);

  const summaryItems = useMemo(() => toSummaryItems(items), [items]);
  const validation = useMemo(() => serviceDiagnosticSchema.safeParse({ ...form.getValues(), items }), [form, items]);
  const itemsError = validation.success ? undefined : validation.error.issues.find((issue) => issue.path[0] === 'items')?.message;

  const saveItem = (item: EditableDiagnosticItem) => {
    setItems((current) => {
      const exists = current.some((currentItem) => currentItem.localId === item.localId);
      return exists ? current.map((currentItem) => (currentItem.localId === item.localId ? item : currentItem)) : [...current, item];
    });
    setEditingItem(undefined);
    setItemFormOpen(false);
  };

  const confirmDeleteItem = () => {
    if (!deleteItem) return;
    setItems((current) => current.filter((item) => item.localId !== deleteItem.localId));
    if (deleteItem.id) setDeletedItemIds((current) => [...current, deleteItem.id as string]);
    setDeleteItem(null);
  };

  const submit = form.handleSubmit(async (values) => {
    const parsed = serviceDiagnosticSchema.safeParse({ ...values, items });
    if (!parsed.success) {
      form.setError('root', { message: parsed.error.issues[0]?.message ?? 'Revise los datos del diagnóstico' });
      return;
    }
    await onSubmit({
      generalObservation: trimOptional(values.generalObservation),
      recommendation: trimOptional(values.recommendation),
      items: parsed.data.items,
      deletedItemIds
    });
  });

  return (
    <form className="space-y-6" onSubmit={(event) => void submit(event)}>
      <HelpPanel
        title="Cómo llenar el diagnóstico"
        items={[
          'Registre cada sistema revisado como un ítem: Motor, Frenos, Luces, Neumáticos, etc.',
          'Use Malo solo cuando exista una falla; en ese caso explique la observación y seleccione severidad.',
          'No repita el mismo elemento dentro de la misma categoría.',
          'Complete el diagnóstico solo cuando ya esté revisado; después no se podrá editar.'
        ]}
      />

      <section className="mm-form-section">
        <div className="mm-section-header">
          <div className="mm-section-icon"><ClipboardCheck className="h-5 w-5" /></div>
          <div>
            <h2 className="text-base font-semibold">Información general</h2>
            <p className="mt-1 text-sm text-muted-foreground">Resumen claro para asesor, mecánico y cliente. Puede dejarlo vacío si todo está en los ítems.</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <FormField label="Observación general" error={form.formState.errors.generalObservation?.message}>
            <textarea className="mm-textarea min-h-32" {...form.register('generalObservation')} placeholder="Ej. Vehículo ingresa por ruido en tren delantero y vibración al frenar." />
          </FormField>
          <FormField label="Recomendación" error={form.formState.errors.recommendation?.message}>
            <textarea className="mm-textarea min-h-32" {...form.register('recommendation')} placeholder="Ej. Se recomienda cotizar frenos delanteros y revisar alineación." />
          </FormField>
        </div>
      </section>

      <section className="mm-form-section">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Ítems del diagnóstico</h2>
            <p className="mt-1 text-sm text-muted-foreground">Agregue todo lo revisado. Mientras más claro, más fácil aprobar el siguiente paso.</p>
            {itemsError ? <p className="mt-2 text-sm font-medium text-red-600">{itemsError}</p> : null}
          </div>
          <Button type="button" onClick={() => { setEditingItem(undefined); setItemFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            Agregar ítem
          </Button>
        </div>

        <div className="mt-5">
          {itemFormOpen ? (
            <DiagnosticItemForm item={editingItem} onSave={saveItem} onCancel={() => { setEditingItem(undefined); setItemFormOpen(false); }} />
          ) : null}
        </div>

        <div className="mt-5">
          <DiagnosticItemsTable
            items={items}
            editable
            onEdit={(item) => {
              setEditingItem(item);
              setItemFormOpen(true);
            }}
            onDelete={setDeleteItem}
          />
        </div>
      </section>

      <DiagnosticSummary items={summaryItems} />

      {form.formState.errors.root?.message ? <p className="text-sm font-medium text-red-600">{form.formState.errors.root.message}</p> : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4" />
          {isSubmitting ? 'Guardando...' : 'Guardar diagnóstico'}
        </Button>
      </div>

      {deleteItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-md bg-card p-5 shadow-lg">
            <ConfirmDialog title={`¿Eliminar el ítem "${deleteItem.itemName}"?`} onConfirm={confirmDeleteItem} />
            <Button type="button" variant="secondary" className="mt-3 w-full" onClick={() => setDeleteItem(null)}>
              <Trash2 className="h-4 w-4" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
