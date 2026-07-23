import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { inventoryProductSchema, type InventoryProductFormInput, type InventoryProductFormValues } from '../schemas/inventory.schema';
import { inventoryUnitOptions } from './inventory-catalogs';
import type { InventoryCategory, InventoryProduct, InventoryProductPayload } from '../types/inventory.types';

interface Props {
  product?: InventoryProduct;
  categories: InventoryCategory[];
  isSubmitting?: boolean;
  onSubmit: (payload: InventoryProductPayload) => void;
}

export function InventoryProductForm({ product, categories, isSubmitting, onSubmit }: Props) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<InventoryProductFormInput, unknown, InventoryProductFormValues>({
    resolver: zodResolver(inventoryProductSchema),
    defaultValues: {
      sku: product?.sku ?? '',
      barcode: product?.barcode ?? '',
      name: product?.name ?? '',
      description: product?.description ?? '',
      categoryId: product?.categoryId ?? '',
      unit: product?.unit ?? 'UNIT',
      costPrice: Number(product?.costPrice ?? 0),
      salePrice: Number(product?.salePrice ?? 0),
      minimumStock: Number(product?.minimumStock ?? 0),
      maximumStock: product?.maximumStock === null || product?.maximumStock === undefined ? '' : Number(product.maximumStock),
      isStockControlled: product?.isStockControlled ?? true,
      isActive: product?.isActive ?? true
    }
  });

  const sku = watch('sku');
  useEffect(() => {
    if (sku && sku !== sku.toUpperCase()) setValue('sku', sku.toUpperCase(), { shouldValidate: true });
  }, [setValue, sku]);

  const submit = (values: InventoryProductFormValues) => {
    onSubmit({
      sku: values.sku.trim().toUpperCase(),
      barcode: values.barcode?.trim() || undefined,
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      categoryId: values.categoryId,
      unit: values.unit as InventoryProductPayload['unit'],
      costPrice: Number(values.costPrice),
      salePrice: Number(values.salePrice),
      minimumStock: Number(values.minimumStock),
      maximumStock: values.maximumStock === '' || values.maximumStock === undefined ? undefined : Number(values.maximumStock),
      isStockControlled: values.isStockControlled,
      isActive: values.isActive
    });
  };

  return (
    <form className="space-y-5 rounded-md border border-border bg-card p-5" onSubmit={(event) => void handleSubmit(submit)(event)}>
      <div className="rounded-md border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
        Registre aquí la ficha del repuesto o insumo. El stock físico no se escribe en este formulario: se carga con un movimiento de inventario.
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="SKU" error={errors.sku?.message}>
          <input className="mm-input font-mono uppercase" {...register('sku')} placeholder="FIL-ACEITE-001" />
        </Field>
        <Field label="Código de barras" error={errors.barcode?.message}>
          <input className="mm-input" {...register('barcode')} placeholder="Opcional" />
        </Field>
        <Field label="Nombre" error={errors.name?.message}>
          <input className="mm-input" {...register('name')} placeholder="Filtro de aceite Toyota" />
        </Field>
        <Field label="Categoría" error={errors.categoryId?.message}>
          <select className="mm-select" {...register('categoryId')}>
            <option value="">Seleccione categoría</option>
            {categories.filter((category) => category.isActive).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <Field label="Unidad" error={errors.unit?.message}>
          <select className="mm-select" {...register('unit')}>
            {inventoryUnitOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        <Field label="Precio de costo" error={errors.costPrice?.message}>
          <input className="mm-input" type="number" step="0.01" min="0" {...register('costPrice')} />
        </Field>
        <Field label="Precio de venta" error={errors.salePrice?.message}>
          <input className="mm-input" type="number" step="0.01" min="0" {...register('salePrice')} />
        </Field>
        <Field label="Stock mínimo" error={errors.minimumStock?.message}>
          <input className="mm-input" type="number" step="0.01" min="0" {...register('minimumStock')} />
        </Field>
        <Field label="Stock máximo" error={errors.maximumStock?.message}>
          <input className="mm-input" type="number" step="0.01" min="0" {...register('maximumStock')} placeholder="Opcional" />
        </Field>
      </div>

      <Field label="Descripción" error={errors.description?.message}>
        <textarea className="mm-input min-h-24" {...register('description')} placeholder="Uso, compatibilidad, observaciones de compra..." />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-md border border-border p-3 text-sm">
          <input type="checkbox" {...register('isStockControlled')} />
          Controlar stock de este producto
        </label>
        <label className="flex items-center gap-2 rounded-md border border-border p-3 text-sm">
          <input type="checkbox" {...register('isActive')} />
          Producto activo
        </label>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        <Save className="mr-2 h-4 w-4" />
        Guardar producto
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error ? <span className="block text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
