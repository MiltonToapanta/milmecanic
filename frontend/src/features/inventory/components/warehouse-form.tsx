import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { warehouseSchema, type WarehouseFormValues } from '../schemas/inventory.schema';
import type { Warehouse, WarehousePayload } from '../types/inventory.types';

export function WarehouseForm({
  warehouse,
  onSubmit,
  onCancel,
  isSubmitting
}: {
  warehouse?: Warehouse;
  onSubmit: (payload: WarehousePayload) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      code: warehouse?.code ?? '',
      name: warehouse?.name ?? '',
      description: warehouse?.description ?? '',
      location: warehouse?.location ?? '',
      isMain: warehouse?.isMain ?? false,
      isActive: warehouse?.isActive ?? true
    }
  });
  const code = watch('code');
  useEffect(() => {
    if (code && code !== code.toUpperCase()) setValue('code', code.toUpperCase(), { shouldValidate: true });
  }, [code, setValue]);

  return (
    <form className="space-y-4 rounded-md border border-border bg-card p-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Código" error={errors.code?.message}><input className="mm-input uppercase" {...register('code')} placeholder="MAIN" /></Field>
        <Field label="Nombre" error={errors.name?.message}><input className="mm-input" {...register('name')} placeholder="Bodega principal" /></Field>
        <Field label="Ubicación"><input className="mm-input" {...register('location')} placeholder="Patio, local, estante..." /></Field>
        <Field label="Descripción"><input className="mm-input" {...register('description')} placeholder="Uso de la bodega" /></Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-md border border-border p-3 text-sm">
          <input type="checkbox" {...register('isMain')} />
          Marcar como bodega principal
        </label>
        <label className="flex items-center gap-2 rounded-md border border-border p-3 text-sm">
          <input type="checkbox" {...register('isActive')} />
          Bodega activa
        </label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}><Save className="mr-2 h-4 w-4" />Guardar</Button>
        {onCancel ? <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button> : null}
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="space-y-2 text-sm"><span className="font-medium">{label}</span>{children}{error ? <span className="text-xs text-red-500">{error}</span> : null}</label>;
}
