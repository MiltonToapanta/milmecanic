import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import type { CreateQuotationItemInput, QuotationItemType } from '../types/quotation.types';

const itemTypeOptions: { value: QuotationItemType; label: string }[] = [
  { value: 'LABOR', label: 'Mano de obra' },
  { value: 'PART', label: 'Repuesto' },
  { value: 'SUPPLY', label: 'Insumo' },
  { value: 'OTHER', label: 'Otro' }
];

interface QuotationItemFormProps {
  initial?: CreateQuotationItemInput;
  onSave: (item: CreateQuotationItemInput) => void;
  onCancel: () => void;
}

export function QuotationItemForm({ initial, onSave, onCancel }: QuotationItemFormProps) {
  const [itemType, setItemType] = useState<QuotationItemType>(initial?.itemType ?? 'LABOR');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [quantity, setQuantity] = useState(initial?.quantity?.toString() ?? '1');
  const [unitPrice, setUnitPrice] = useState(initial?.unitPrice?.toString() ?? '0');
  const [discount, setDiscount] = useState(initial?.discount?.toString() ?? '0');
  const [taxRate, setTaxRate] = useState(initial?.taxRate?.toString() ?? '0');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!description.trim()) newErrors.description = 'La descripción es obligatoria';
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) newErrors.quantity = 'La cantidad debe ser mayor que cero';
    const price = Number(unitPrice);
    if (isNaN(price) || price < 0) newErrors.unitPrice = 'El precio unitario no puede ser negativo';
    const disc = Number(discount);
    if (isNaN(disc) || disc < 0) newErrors.discount = 'El descuento no puede ser negativo';
    if (disc > qty * price) newErrors.discount = 'El descuento no puede superar el valor base';
    const tax = Number(taxRate);
    if (isNaN(tax) || tax < 0 || tax > 100) newErrors.taxRate = 'Debe estar entre 0 y 100';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({
      itemType,
      description: description.trim(),
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      discount: Number(discount),
      taxRate: Number(taxRate)
    });
  };

  const base = (Number(quantity) || 0) * (Number(unitPrice) || 0);
  const itemSubtotal = base - (Number(discount) || 0);
  const itemTax = (itemSubtotal * (Number(taxRate) || 0)) / 100;
  const itemTotal = itemSubtotal + itemTax;

  return (
    <div className="space-y-4 rounded-md border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium">Tipo</label>
          <select value={itemType} onChange={(e) => setItemType(e.target.value as QuotationItemType)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
            {itemTypeOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
          </select>
        </div>
        <div className="sm:col-span-2 lg:col-span-2">
          <label className="mb-1 block text-xs font-medium">Descripción</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ej: Cambio de aceite" />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Cantidad</label>
          <Input type="number" step="0.01" min="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Precio unitario</label>
          <Input type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
          {errors.unitPrice && <p className="mt-1 text-xs text-red-600">{errors.unitPrice}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Descuento</label>
          <Input type="number" step="0.01" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          {errors.discount && <p className="mt-1 text-xs text-red-600">{errors.discount}</p>}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium">Tasa de impuesto (%)</label>
          <Input type="number" step="0.01" min="0" max="100" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
          {errors.taxRate && <p className="mt-1 text-xs text-red-600">{errors.taxRate}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-muted/60 px-4 py-2 text-sm">
        <span className="text-muted-foreground">Vista previa:</span>
        <span>Base: ${itemSubtotal.toFixed(2)}</span>
        <span>Imp: ${itemTax.toFixed(2)}</span>
        <span className="font-semibold">Total ítem: ${itemTotal.toFixed(2)}</span>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={handleSubmit}>
          {initial ? 'Actualizar ítem' : 'Agregar ítem'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
