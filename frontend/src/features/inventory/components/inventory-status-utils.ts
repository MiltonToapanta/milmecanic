import type { InventoryProduct } from '../types/inventory.types';

export type InventoryStockStatus = 'available' | 'low' | 'out' | 'uncontrolled' | 'inactive';

export function getInventoryStockStatus(product: InventoryProduct): InventoryStockStatus {
  if (!product.isActive) return 'inactive';
  if (!product.isStockControlled) return 'uncontrolled';
  if (product.availableStock <= 0) return 'out';
  if (product.availableStock <= Number(product.minimumStock)) return 'low';
  return 'available';
}
