export type InventoryUnit =
  | 'UNIT'
  | 'PAIR'
  | 'SET'
  | 'LITER'
  | 'MILLILITER'
  | 'GALLON'
  | 'KILOGRAM'
  | 'GRAM'
  | 'METER'
  | 'CENTIMETER'
  | 'BOX'
  | 'PACKAGE'
  | 'OTHER';

export type StockMovementType =
  | 'INITIAL'
  | 'PURCHASE_ENTRY'
  | 'MANUAL_ENTRY'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'SERVICE_ORDER_EXIT'
  | 'RETURN_ENTRY'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'DAMAGED_EXIT';

export type StockReferenceType =
  | 'MANUAL'
  | 'PURCHASE'
  | 'TRANSFER'
  | 'SERVICE_ORDER'
  | 'QUOTATION'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'OTHER';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  activeProductsCount: number;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  location?: string | null;
  isMain: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  productsCount: number;
  stockTotal: number;
  inventoryValue: number;
}

export interface WarehouseStock {
  warehouse: {
    id: string;
    code: string;
    name: string;
    isMain: boolean;
  };
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  averageCost: number;
}

export interface InventoryProduct {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  categoryId: string;
  category: { id: string; name: string };
  unit: InventoryUnit;
  costPrice: number | string;
  salePrice: number | string;
  minimumStock: number | string;
  maximumStock?: number | string | null;
  isStockControlled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  stockByWarehouse: WarehouseStock[];
}

export interface StockMovement {
  id: string;
  movementNumber: string;
  product: { id: string; sku: string; name: string };
  warehouse: { id: string; code: string; name: string };
  movementType: StockMovementType;
  entryQuantity: number;
  exitQuantity: number;
  quantity: number;
  unitCost: number | string;
  totalCost: number | string;
  previousStock: number;
  newStock: number;
  referenceType: StockReferenceType;
  referenceId?: string | null;
  reason?: string | null;
  notes?: string | null;
  createdAt: string;
  user?: { id: string; displayName: string } | null;
}

export interface InventoryFilters {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  warehouseId?: string;
  isActive?: boolean;
  isStockControlled?: boolean;
  lowStock?: boolean;
  outOfStock?: boolean;
}

export interface StockMovementQuery {
  page: number;
  limit: number;
  warehouseId?: string;
  movementType?: StockMovementType;
  dateFrom?: string;
  dateTo?: string;
}

export interface InventoryProductPayload {
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  unit: InventoryUnit;
  costPrice: number;
  salePrice: number;
  minimumStock: number;
  maximumStock?: number;
  isStockControlled: boolean;
  isActive: boolean;
}

export interface InventoryCategoryPayload {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface WarehousePayload {
  code: string;
  name: string;
  description?: string;
  location?: string;
  isMain: boolean;
  isActive: boolean;
}

export interface StockMovementPayload {
  productId: string;
  warehouseId: string;
  movementType: StockMovementType;
  quantity: number;
  unitCost?: number;
  referenceType?: StockReferenceType;
  referenceId?: string;
  reason?: string;
  notes?: string;
}

export type InventoryProductListResponse = PaginatedResponse<InventoryProduct>;
export type StockListResponse = PaginatedResponse<{
  product: {
    id: string;
    sku: string;
    name: string;
    category: { id: string; name: string };
    unit: InventoryUnit;
    minimumStock: number;
  };
  totalStock: number;
  availableStock: number;
  reservedStock: number;
  stockByWarehouse: WarehouseStock[];
}>;
export type KardexResponse = PaginatedResponse<StockMovement>;
