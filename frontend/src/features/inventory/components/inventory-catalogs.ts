import type { InventoryUnit, StockMovementType, StockReferenceType } from '../types/inventory.types';

export const inventoryUnitOptions: Array<{ value: InventoryUnit; label: string }> = [
  { value: 'UNIT', label: 'Unidad' },
  { value: 'PAIR', label: 'Par' },
  { value: 'SET', label: 'Juego' },
  { value: 'LITER', label: 'Litro' },
  { value: 'MILLILITER', label: 'Mililitro' },
  { value: 'GALLON', label: 'Galón' },
  { value: 'KILOGRAM', label: 'Kilogramo' },
  { value: 'GRAM', label: 'Gramo' },
  { value: 'METER', label: 'Metro' },
  { value: 'CENTIMETER', label: 'Centímetro' },
  { value: 'BOX', label: 'Caja' },
  { value: 'PACKAGE', label: 'Paquete' },
  { value: 'OTHER', label: 'Otro' }
];

export const stockMovementTypeOptions: Array<{ value: StockMovementType; label: string }> = [
  { value: 'INITIAL', label: 'Stock inicial' },
  { value: 'PURCHASE_ENTRY', label: 'Entrada por compra' },
  { value: 'MANUAL_ENTRY', label: 'Entrada manual' },
  { value: 'TRANSFER_IN', label: 'Entrada por transferencia' },
  { value: 'TRANSFER_OUT', label: 'Salida por transferencia' },
  { value: 'SERVICE_ORDER_EXIT', label: 'Salida por orden de servicio' },
  { value: 'RETURN_ENTRY', label: 'Entrada por devolución' },
  { value: 'ADJUSTMENT_IN', label: 'Ajuste de entrada' },
  { value: 'ADJUSTMENT_OUT', label: 'Ajuste de salida' },
  { value: 'DAMAGED_EXIT', label: 'Salida por daño' }
];

export const manualStockMovementTypeOptions = stockMovementTypeOptions.filter((option) =>
  ['INITIAL', 'MANUAL_ENTRY', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'DAMAGED_EXIT'].includes(option.value)
);

export const stockReferenceTypeOptions: Array<{ value: StockReferenceType; label: string }> = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'PURCHASE', label: 'Compra' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'SERVICE_ORDER', label: 'Orden de servicio' },
  { value: 'QUOTATION', label: 'Cotización' },
  { value: 'RETURN', label: 'Devolución' },
  { value: 'ADJUSTMENT', label: 'Ajuste' },
  { value: 'OTHER', label: 'Otro' }
];

export function getInventoryUnitLabel(value: InventoryUnit): string {
  return inventoryUnitOptions.find((option) => option.value === value)?.label ?? value;
}

export function getStockMovementTypeLabel(value: StockMovementType): string {
  return stockMovementTypeOptions.find((option) => option.value === value)?.label ?? value;
}

export function getStockReferenceTypeLabel(value: StockReferenceType): string {
  return stockReferenceTypeOptions.find((option) => option.value === value)?.label ?? value;
}
