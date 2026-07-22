import { z } from 'zod';

const quotationItemSchema = z.object({
  itemType: z.enum(['LABOR', 'PART', 'SUPPLY', 'OTHER'], { error: 'Seleccione el tipo de ítem' }),
  description: z.string().trim().min(1, 'La descripción es obligatoria').max(250, 'Máximo 250 caracteres'),
  quantity: z.coerce.number().min(0.01, 'La cantidad debe ser mayor que cero'),
  unitPrice: z.coerce.number().min(0, 'El precio unitario no puede ser negativo'),
  discount: z.coerce.number().min(0, 'El descuento no puede ser negativo').default(0),
  taxRate: z.coerce.number().min(0, 'No puede ser negativo').max(100, 'Máximo 100%').default(0)
}).refine(
  (data) => {
    const base = data.quantity * data.unitPrice;
    return data.discount <= base;
  },
  { message: 'El descuento no puede superar el valor base (cantidad × precio)', path: ['discount'] }
);

export const createQuotationSchema = z.object({
  serviceOrderId: z.string().uuid('Seleccione una orden de servicio'),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
  discount: z.coerce.number().min(0, 'El descuento no puede ser negativo').default(0),
  items: z.array(quotationItemSchema).min(1, 'Agregue al menos un ítem')
}).refine(
  (data) => {
    const itemsSubtotal = data.items.reduce((sum, item) => {
      const base = item.quantity * item.unitPrice;
      const itemSubtotal = base - item.discount;
      return sum + itemSubtotal;
    }, 0);
    return data.discount <= itemsSubtotal;
  },
  { message: 'El descuento general no puede superar el subtotal', path: ['discount'] }
);

export const updateQuotationSchema = z.object({
  validUntil: z.string().optional().nullable(),
  notes: z.string().optional(),
  discount: z.coerce.number().min(0, 'El descuento no puede ser negativo').optional(),
  items: z.array(quotationItemSchema).optional()
});

export type CreateQuotationSchemaInput = z.input<typeof createQuotationSchema>;
export type CreateQuotationSchemaValues = z.output<typeof createQuotationSchema>;
export type UpdateQuotationSchemaValues = z.output<typeof updateQuotationSchema>;
