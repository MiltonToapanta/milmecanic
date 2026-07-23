import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { inventoryCategorySchema, type InventoryCategoryFormValues } from '../schemas/inventory.schema';
import type { InventoryCategory, InventoryCategoryPayload } from '../types/inventory.types';

export function InventoryCategoryForm({
  category,
  onSubmit,
  onCancel,
  isSubmitting
}: {
  category?: InventoryCategory;
  onSubmit: (payload: InventoryCategoryPayload) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<InventoryCategoryFormValues>({
    resolver: zodResolver(inventoryCategorySchema),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
      isActive: category?.isActive ?? true
    }
  });

  return (
    <form className="space-y-4 rounded-md border border-border bg-card p-4" onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
      <label className="space-y-2 text-sm">
        <span className="font-medium">Nombre de la categoría</span>
        <input className="mm-input" {...register('name')} placeholder="Filtros, lubricantes, frenos..." />
        {errors.name ? <span className="text-xs text-red-500">{errors.name.message}</span> : null}
      </label>
      <label className="space-y-2 text-sm">
        <span className="font-medium">Descripción</span>
        <textarea className="mm-input min-h-20" {...register('description')} placeholder="Uso de esta categoría dentro del taller" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('isActive')} />
        Categoría activa
      </label>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}><Save className="mr-2 h-4 w-4" />Guardar</Button>
        {onCancel ? <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button> : null}
      </div>
    </form>
  );
}
