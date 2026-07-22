import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Plus, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { FormField } from '../../../components/forms/FormField';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { getServiceOrders } from '../../service-orders/api/service-orders.api';
import type { ServiceOrder } from '../../service-orders/types/service-order.types';
import { createQuotationSchema, type CreateQuotationSchemaInput } from '../schemas/quotation.schema';
import type { CreateQuotationItemInput, CreateQuotationPayload, Quotation } from '../types/quotation.types';

// Helper type for items from form
interface FormQuotationItem {
  itemType: 'LABOR' | 'PART' | 'SUPPLY' | 'OTHER';
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}
import { formatCurrency } from './quotation-helpers';
import { QuotationItemForm } from './quotation-item-form';
import { QuotationItemsTable } from './quotation-items-table';
import { QuotationSummary } from './quotation-summary';

interface QuotationFormProps {
  quotation?: Quotation;
  initialServiceOrderId?: string;
  isSubmitting: boolean;
  onSubmit: (payload: CreateQuotationPayload) => Promise<void>;
}

const CANNOT_QUOTE_STATUSES = ['DELIVERED', 'CANCELLED'];

function calcBase(qty: number, price: number): number { return qty * price; }
function calcSubtotal(base: number, discount: number): number { return base - discount; }
function calcTax(subtotal: number, rate: number): number { return (subtotal * rate) / 100; }
function calcTotal(subtotal: number, tax: number): number { return subtotal + tax; }

export function QuotationForm({ quotation, initialServiceOrderId, isSubmitting, onSubmit }: QuotationFormProps) {
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [items, setItems] = useState<CreateQuotationItemInput[]>(
    quotation?.items.map((item) => ({
      itemType: item.itemType,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      taxRate: item.taxRate
    })) ?? []
  );
  const [itemsError, setItemsError] = useState('');

  const isEditing = Boolean(quotation);

  const { control, handleSubmit, formState: { errors } } = useForm<CreateQuotationSchemaInput>({
    resolver: zodResolver(createQuotationSchema),
    defaultValues: {
      serviceOrderId: quotation?.serviceOrderId ?? initialServiceOrderId ?? '',
      validUntil: quotation?.validUntil ? quotation.validUntil.split('T')[0] : '',
      notes: quotation?.notes ?? '',
      discount: quotation?.discount ?? 0,
      items: [] // items managed locally
    }
  });

  const serviceOrdersQuery = useQuery({
    queryKey: ['quotations-form-service-orders'],
    queryFn: () => getServiceOrders({ page: 1, limit: 200, isActive: true })
  });

  const availableOrders = (serviceOrdersQuery.data?.items ?? []).filter(
    (order: ServiceOrder) => !CANNOT_QUOTE_STATUSES.includes(order.status)
  );

  // Calculate visual subtotals
  const visualSubtotal = items.reduce((sum, item) => {
    const base = calcBase(item.quantity, item.unitPrice);
    const st = calcSubtotal(base, item.discount ?? 0);
    return sum + st;
  }, 0);

  const visualTax = items.reduce((sum, item) => {
    const base = calcBase(item.quantity, item.unitPrice);
    const st = calcSubtotal(base, item.discount ?? 0);
    const tax = calcTax(st, item.taxRate ?? 0);
    return sum + tax;
  }, 0);

  const visualTotal = visualSubtotal - items.reduce((sum, i) => sum + (i.discount ?? 0), 0) + visualTax;

  const handleCreateItem = (item: CreateQuotationItemInput) => {
    if (editingItemIndex !== null) {
      const updated = [...items];
      updated[editingItemIndex] = item;
      setItems(updated);
      setEditingItemIndex(null);
    } else {
      setItems([...items, item]);
    }
    setShowItemForm(false);
    setItemsError('');
  };

  const handleEditItem = (index: number) => {
    setEditingItemIndex(index);
    setShowItemForm(true);
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleDuplicateItem = (index: number) => {
    setItems([...items, { ...items[index] }]);
  };

  const onFormSubmit = async (data: CreateQuotationSchemaInput) => {
    if (items.length === 0) {
      setItemsError('Agregue al menos un ítem');
      return;
    }

    const payload: CreateQuotationPayload = {
      serviceOrderId: data.serviceOrderId,
      validUntil: data.validUntil || undefined,
      notes: data.notes || undefined,
      discount: (data.discount as number) ?? 0,
      items: items.map((item) => ({
        itemType: item.itemType,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate
      }))
    };
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Service Order Selection */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Orden de servicio" error={errors.serviceOrderId?.message}>
          <Controller
            name="serviceOrderId"
            control={control}
            render={({ field }) => (
              <select
                {...field}
                disabled={isEditing || Boolean(initialServiceOrderId)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
              >
                <option value="">Seleccione una orden...</option>
                {availableOrders.map((order: ServiceOrder) => (
                  <option key={order.id} value={order.id}>
                    {order.orderNumber} — {order.customer.displayName} — {order.vehicle.plate} ({order.vehicle.displayName})
                  </option>
                ))}
              </select>
            )}
          />
        </FormField>

        <FormField label="Vigencia hasta" error={errors.validUntil?.message}>
          <Controller name="validUntil" control={control} render={({ field }) => <Input type="date" value={field.value as string ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} />} />
        </FormField>
      </div>

      <FormField label="Notas">
        <Controller name="notes" control={control} render={({ field }) => <Input value={field.value as string ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} placeholder="Notas internas de la cotización..." />} />
      </FormField>

      <FormField label="Descuento general" error={errors.discount?.message}>
        <Controller name="discount" control={control} render={({ field }) => <Input type="number" step="0.01" min="0" value={(field.value as number) ?? 0} onChange={field.onChange} onBlur={field.onBlur} name={field.name} />} />
      </FormField>

      {/* Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Ítems</h3>
          {!showItemForm && (
            <Button type="button" variant="secondary" onClick={() => { setEditingItemIndex(null); setShowItemForm(true); }}>
              <Plus className="mr-1 h-4 w-4" /> Agregar ítem
            </Button>
          )}
        </div>

        {itemsError && <p className="text-sm text-red-600">{itemsError}</p>}

        {showItemForm && (
          <QuotationItemForm
            initial={editingItemIndex !== null ? items[editingItemIndex] : undefined}
            onSave={handleCreateItem}
            onCancel={() => { setShowItemForm(false); setEditingItemIndex(null); }}
          />
        )}

        <QuotationItemsTable
          items={items}
          onEdit={handleEditItem}
          onDelete={handleDeleteItem}
          onDuplicate={handleDuplicateItem}
        />

        {items.length > 0 && (
          <QuotationSummary
            subtotal={visualSubtotal}
            discount={0}
            tax={visualTax}
            total={visualTotal}
          />
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          <Save className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Guardando...' : isEditing ? 'Actualizar cotización' : 'Crear cotización'}
        </Button>
      </div>
    </form>
  );
}
