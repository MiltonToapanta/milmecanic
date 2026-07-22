import type { QuotationItemType } from '../types/quotation.types';

const itemTypeLabels: Record<QuotationItemType, string> = {
  LABOR: 'Mano de obra',
  PART: 'Repuesto',
  SUPPLY: 'Insumo',
  OTHER: 'Otro'
};

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-EC', { dateStyle: 'medium' }).format(new Date(value));
}

export function formatOptionalDate(value?: string | null): string {
  return value ? formatDate(value) : '—';
}

export function getItemTypeLabel(type: QuotationItemType): string {
  return itemTypeLabels[type];
}
