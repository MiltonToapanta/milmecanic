import { z } from 'zod';

export const inventoryProductSchema = z.object({
  sku: z.string().trim().min(1, 'El SKU es obligatorio').max(80),
  barcode: z.string().trim().max(80).optional(),
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(180),
  description: z.string().trim().optional(),
  categoryId: z.string().min(1, 'Seleccione una categoría'),
  unit: z.string().min(1, 'Seleccione una unidad'),
  costPrice: z.coerce.number().min(0, 'El costo no puede ser negativo'),
  salePrice: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  minimumStock: z.coerce.number().min(0, 'El stock mínimo no puede ser negativo'),
  maximumStock: z.union([z.coerce.number().min(0), z.literal(''), z.undefined()]).optional(),
  isStockControlled: z.boolean(),
  isActive: z.boolean()
}).superRefine((data, ctx) => {
  const maximum = data.maximumStock === '' || data.maximumStock === undefined ? undefined : Number(data.maximumStock);
  if (maximum !== undefined && maximum < data.minimumStock) {
    ctx.addIssue({
      code: 'custom',
      path: ['maximumStock'],
      message: 'El stock máximo no puede ser menor que el mínimo'
    });
  }
});

export const inventoryCategorySchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  description: z.string().trim().optional(),
  isActive: z.boolean()
});

export const warehouseSchema = z.object({
  code: z.string().trim().min(1, 'El código es obligatorio').max(40),
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(140),
  description: z.string().trim().optional(),
  location: z.string().trim().optional(),
  isMain: z.boolean(),
  isActive: z.boolean()
});

export const stockMovementSchema = z.object({
  productId: z.string().min(1, 'Seleccione un producto'),
  warehouseId: z.string().min(1, 'Seleccione una bodega'),
  movementType: z.string().min(1, 'Seleccione el tipo de movimiento'),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor que cero'),
  unitCost: z.union([z.coerce.number().min(0), z.literal(''), z.undefined()]).optional(),
  referenceType: z.string().optional(),
  referenceId: z.string().trim().optional(),
  reason: z.string().trim().optional(),
  notes: z.string().trim().optional()
}).superRefine((data, ctx) => {
  const needsCost = ['INITIAL', 'MANUAL_ENTRY', 'ADJUSTMENT_IN'].includes(data.movementType);
  if (needsCost && (data.unitCost === '' || data.unitCost === undefined)) {
    ctx.addIssue({ code: 'custom', path: ['unitCost'], message: 'El costo unitario es obligatorio para entradas' });
  }

  const needsReason = ['ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'DAMAGED_EXIT'].includes(data.movementType);
  if (needsReason && !data.reason?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['reason'], message: 'El motivo es obligatorio para este movimiento' });
  }
});

export type InventoryProductFormValues = z.infer<typeof inventoryProductSchema>;
export type InventoryProductFormInput = z.input<typeof inventoryProductSchema>;
export type InventoryCategoryFormValues = z.infer<typeof inventoryCategorySchema>;
export type WarehouseFormValues = z.infer<typeof warehouseSchema>;
export type StockMovementFormValues = z.infer<typeof stockMovementSchema>;
export type StockMovementFormInput = z.input<typeof stockMovementSchema>;
