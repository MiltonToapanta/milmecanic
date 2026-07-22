import { formatCurrency } from './quotation-helpers';

interface QuotationSummaryProps {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

export function QuotationSummary({ subtotal, discount, tax, total }: QuotationSummaryProps) {
  return (
    <div className="rounded-md border border-border bg-muted/40 p-4">
      <h3 className="mb-3 text-sm font-semibold">Resumen</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Descuento general</span>
          <span className="text-red-600 dark:text-red-400">-{formatCurrency(discount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Impuestos</span>
          <span>{formatCurrency(tax)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 font-bold text-base">
          <span>Total estimado</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
