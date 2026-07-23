export function formatCurrency(value: number | string | null | undefined, currency = 'USD'): string {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

export function formatNumber(value: number | string | null | undefined): string {
  const numericValue = Number(value ?? 0);
  return new Intl.NumberFormat('es-EC', {
    maximumFractionDigits: 2
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

export function formatDateTime(value?: string | null): string {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-EC', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}
