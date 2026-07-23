import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { stockMovementSchema, type StockMovementFormInput, type StockMovementFormValues } from '../schemas/inventory.schema';
import { manualStockMovementTypeOptions, stockReferenceTypeOptions } from './inventory-catalogs';
import type { InventoryProduct, StockMovementPayload, Warehouse } from '../types/inventory.types';

export function StockMovementForm({
  products,
  warehouses,
  selectedProductId,
  onSubmit,
  onCancel,
  isSubmitting
}: {
  products: InventoryProduct[];
  warehouses: Warehouse[];
  selectedProductId?: string;
  onSubmit: (payload: StockMovementPayload) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<StockMovementFormInput, unknown, StockMovementFormValues>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      productId: selectedProductId ?? '',
      warehouseId: '',
      movementType: 'INITIAL',
      quantity: 1,
      unitCost: '',
      referenceType: 'MANUAL',
      referenceId: '',
      reason: '',
      notes: ''
    }
  });

  const productId = watch('productId');
  const warehouseId = watch('warehouseId');
  const quantity = Number(watch('quantity') || 0);
  const movementType = watch('movementType');
  const product = products.find((item) => item.id === productId);
  const warehouseStock = product?.stockByWarehouse.find((stock) => stock.warehouse.id === warehouseId);
  const isExit = ['ADJUSTMENT_OUT', 'DAMAGED_EXIT'].includes(movementType);
  const warning = useMemo(() => {
    if (!isExit || !warehouseStock) return '';
    if (quantity > warehouseStock.availableQuantity) return 'La salida supera el stock disponible. El backend rechazará el movimiento.';
    return '';
  }, [isExit, quantity, warehouseStock]);

  const submit = (values: StockMovementFormValues) => {
    onSubmit({
      productId: values.productId,
      warehouseId: values.warehouseId,
      movementType: values.movementType as StockMovementPayload['movementType'],
      quantity: Number(values.quantity),
      unitCost: values.unitCost === '' || values.unitCost === undefined ? undefined : Number(values.unitCost),
      referenceType: values.referenceType as StockMovementPayload['referenceType'],
      referenceId: values.referenceId?.trim() || undefined,
      reason: values.reason?.trim() || undefined,
      notes: values.notes?.trim() || undefined
    });
  };

  return (
    <form className="space-y-4 rounded-md border border-border bg-card p-5" onSubmit={(event) => void handleSubmit(submit)(event)}>
      <div className="rounded-md bg-primary/5 p-3 text-sm text-muted-foreground">
        Los movimientos son definitivos. Para corregir stock use un ajuste de entrada o salida con motivo claro.
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Producto" error={errors.productId?.message}>
          <select className="mm-select" {...register('productId')} disabled={Boolean(selectedProductId)}>
            <option value="">Seleccione producto</option>
            {products.filter((item) => item.isActive).map((item) => <option key={item.id} value={item.id}>{item.sku} · {item.name}</option>)}
          </select>
        </Field>
        <Field label="Bodega" error={errors.warehouseId?.message}>
          <select className="mm-select" {...register('warehouseId')}>
            <option value="">Seleccione bodega</option>
            {warehouses.filter((warehouse) => warehouse.isActive).map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} · {warehouse.name}</option>)}
          </select>
        </Field>
        <Field label="Tipo de movimiento" error={errors.movementType?.message}>
          <select className="mm-select" {...register('movementType')}>
            {manualStockMovementTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        <Field label="Cantidad" error={errors.quantity?.message}>
          <input className="mm-input" type="number" step="0.01" min="0.01" {...register('quantity')} />
        </Field>
        <Field label="Costo unitario" error={errors.unitCost?.message}>
          <input className="mm-input" type="number" step="0.01" min="0" {...register('unitCost')} placeholder="Obligatorio en entradas" />
        </Field>
        <Field label="Tipo de referencia">
          <select className="mm-select" {...register('referenceType')}>
            {stockReferenceTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </Field>
        <Field label="ID de referencia"><input className="mm-input" {...register('referenceId')} placeholder="Opcional" /></Field>
        <Field label="Motivo" error={errors.reason?.message}><input className="mm-input" {...register('reason')} placeholder="Ej. ajuste por conteo físico" /></Field>
      </div>
      {warning ? <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950">{warning}</p> : null}
      <Field label="Notas"><textarea className="mm-input min-h-20" {...register('notes')} /></Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}><Save className="mr-2 h-4 w-4" />Registrar movimiento</Button>
        {onCancel ? <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button> : null}
      </div>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="space-y-2 text-sm"><span className="font-medium">{label}</span>{children}{error ? <span className="text-xs text-red-500">{error}</span> : null}</label>;
}
