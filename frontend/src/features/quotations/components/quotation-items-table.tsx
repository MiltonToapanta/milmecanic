import type { CreateQuotationItemInput, QuotationItem, QuotationItemType } from '../types/quotation.types';
import { formatCurrency, getItemTypeLabel } from './quotation-helpers';

interface QuotationItemsTableProps {
  items: Array<QuotationItem | CreateQuotationItemInput>;
  readonly?: boolean;
  onEdit?: (index: number) => void;
  onDelete?: (index: number) => void;
  onDuplicate?: (index: number) => void;
}

function isQuotationItem(item: QuotationItem | CreateQuotationItemInput): item is QuotationItem {
  return 'id' in item && 'subtotal' in item && 'tax' in item && 'total' in item;
}

function calcBase(qty: number, price: number): number {
  return qty * price;
}

function calcSubtotal(base: number, discount: number): number {
  return base - discount;
}

function calcTax(subtotal: number, rate: number): number {
  return (subtotal * rate) / 100;
}

function calcTotal(subtotal: number, tax: number): number {
  return subtotal + tax;
}

export function QuotationItemsTable({ items, readonly = false, onEdit, onDelete, onDuplicate }: QuotationItemsTableProps) {
  if (items.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No hay ítems en esta cotización.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Descripción</th>
            <th className="px-3 py-2 text-right font-medium">Cant.</th>
            <th className="px-3 py-2 text-right font-medium">P. Unit.</th>
            <th className="px-3 py-2 text-right font-medium">Desc.</th>
            <th className="px-3 py-2 text-right font-medium">Imp.</th>
            <th className="px-3 py-2 text-right font-medium">Subtotal</th>
            <th className="px-3 py-2 text-right font-medium">Total</th>
            {!readonly && <th className="px-3 py-2 text-center font-medium">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const base = calcBase(item.quantity, item.unitPrice);
            const subtotal = isQuotationItem(item) ? item.subtotal : calcSubtotal(base, item.discount ?? 0);
            const tax = isQuotationItem(item) ? item.tax : calcTax(subtotal, item.taxRate ?? 0);
            const total = isQuotationItem(item) ? item.total : calcTotal(subtotal, tax);
            const displayDiscount = isQuotationItem(item) ? item.discount : (item.discount ?? 0);
            const displayTaxRate = isQuotationItem(item) ? item.taxRate : (item.taxRate ?? 0);

            return (
              <tr key={isQuotationItem(item) ? item.id : index} className="border-t border-border">
                <td className="px-3 py-2">{getItemTypeLabel(item.itemType as QuotationItemType)}</td>
                <td className="px-3 py-2 max-w-[200px] truncate">{item.description}</td>
                <td className="px-3 py-2 text-right">{item.quantity}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(displayDiscount)}</td>
                <td className="px-3 py-2 text-right">{displayTaxRate}%</td>
                <td className="px-3 py-2 text-right">{formatCurrency(subtotal)}</td>
                <td className="px-3 py-2 text-right font-medium">{formatCurrency(total)}</td>
                {!readonly && (
                  <td className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950" onClick={() => onEdit?.(index)}>
                        Editar
                      </button>
                      <button type="button" className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800" onClick={() => onDuplicate?.(index)}>
                        Duplicar
                      </button>
                      <button type="button" className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950" onClick={() => onDelete?.(index)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
