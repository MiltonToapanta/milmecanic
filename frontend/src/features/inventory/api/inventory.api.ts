import { apiClient } from '../../../services/api-client';
import type { ApiResponse } from '../../../types/api';
import type {
  InventoryCategory,
  InventoryCategoryPayload,
  InventoryFilters,
  InventoryProduct,
  InventoryProductListResponse,
  InventoryProductPayload,
  KardexResponse,
  StockListResponse,
  StockMovement,
  StockMovementPayload,
  StockMovementQuery,
  Warehouse,
  WarehousePayload
} from '../types/inventory.types';

function buildInventoryParams(query: InventoryFilters): URLSearchParams {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.search) params.set('search', query.search);
  if (query.categoryId) params.set('categoryId', query.categoryId);
  if (query.warehouseId) params.set('warehouseId', query.warehouseId);
  if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
  if (query.isStockControlled !== undefined) params.set('isStockControlled', String(query.isStockControlled));
  if (query.lowStock !== undefined) params.set('lowStock', String(query.lowStock));
  if (query.outOfStock !== undefined) params.set('outOfStock', String(query.outOfStock));
  return params;
}

function buildKardexParams(query: StockMovementQuery): URLSearchParams {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.warehouseId) params.set('warehouseId', query.warehouseId);
  if (query.movementType) params.set('movementType', query.movementType);
  if (query.dateFrom) params.set('dateFrom', query.dateFrom);
  if (query.dateTo) params.set('dateTo', query.dateTo);
  return params;
}

export async function getInventoryProducts(query: InventoryFilters): Promise<InventoryProductListResponse> {
  const { data } = await apiClient.get<ApiResponse<InventoryProductListResponse>>(`/inventory/products?${buildInventoryParams(query).toString()}`);
  return data.data;
}

export async function getInventoryProduct(id: string): Promise<InventoryProduct> {
  const { data } = await apiClient.get<ApiResponse<InventoryProduct>>(`/inventory/products/${id}`);
  return data.data;
}

export async function createInventoryProduct(payload: InventoryProductPayload): Promise<InventoryProduct> {
  const { data } = await apiClient.post<ApiResponse<InventoryProduct>>('/inventory/products', payload);
  return data.data;
}

export async function updateInventoryProduct(id: string, payload: InventoryProductPayload): Promise<InventoryProduct> {
  const { data } = await apiClient.patch<ApiResponse<InventoryProduct>>(`/inventory/products/${id}`, payload);
  return data.data;
}

export async function deleteInventoryProduct(id: string): Promise<InventoryProduct> {
  const { data } = await apiClient.delete<ApiResponse<InventoryProduct>>(`/inventory/products/${id}`);
  return data.data;
}

export async function getInventoryCategories(query: { search?: string; isActive?: boolean } = {}): Promise<InventoryCategory[]> {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
  const { data } = await apiClient.get<ApiResponse<InventoryCategory[]>>(`/inventory/categories?${params.toString()}`);
  return data.data;
}

export async function createInventoryCategory(payload: InventoryCategoryPayload): Promise<InventoryCategory> {
  const { data } = await apiClient.post<ApiResponse<InventoryCategory>>('/inventory/categories', payload);
  return data.data;
}

export async function updateInventoryCategory(id: string, payload: InventoryCategoryPayload): Promise<InventoryCategory> {
  const { data } = await apiClient.patch<ApiResponse<InventoryCategory>>(`/inventory/categories/${id}`, payload);
  return data.data;
}

export async function deleteInventoryCategory(id: string): Promise<InventoryCategory> {
  const { data } = await apiClient.delete<ApiResponse<InventoryCategory>>(`/inventory/categories/${id}`);
  return data.data;
}

export async function getWarehouses(query: { search?: string; isActive?: boolean } = {}): Promise<Warehouse[]> {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
  const { data } = await apiClient.get<ApiResponse<Warehouse[]>>(`/inventory/warehouses?${params.toString()}`);
  return data.data;
}

export async function createWarehouse(payload: WarehousePayload): Promise<Warehouse> {
  const { data } = await apiClient.post<ApiResponse<Warehouse>>('/inventory/warehouses', payload);
  return data.data;
}

export async function updateWarehouse(id: string, payload: WarehousePayload): Promise<Warehouse> {
  const { data } = await apiClient.patch<ApiResponse<Warehouse>>(`/inventory/warehouses/${id}`, payload);
  return data.data;
}

export async function deleteWarehouse(id: string): Promise<Warehouse> {
  const { data } = await apiClient.delete<ApiResponse<Warehouse>>(`/inventory/warehouses/${id}`);
  return data.data;
}

export async function createStockMovement(payload: StockMovementPayload): Promise<StockMovement> {
  const { data } = await apiClient.post<ApiResponse<StockMovement>>('/inventory/movements', payload);
  return data.data;
}

export async function getInventoryStock(query: InventoryFilters): Promise<StockListResponse> {
  const { data } = await apiClient.get<ApiResponse<StockListResponse>>(`/inventory/stock?${buildInventoryParams(query).toString()}`);
  return data.data;
}

export async function getProductStock(productId: string): Promise<InventoryProduct> {
  const { data } = await apiClient.get<ApiResponse<InventoryProduct>>(`/inventory/stock/${productId}`);
  return data.data;
}

export async function getWarehouseStock(warehouseId: string, query: InventoryFilters): Promise<StockListResponse> {
  const { data } = await apiClient.get<ApiResponse<StockListResponse>>(`/inventory/warehouses/${warehouseId}/stock?${buildInventoryParams(query).toString()}`);
  return data.data;
}

export async function getProductKardex(productId: string, query: StockMovementQuery): Promise<KardexResponse> {
  const { data } = await apiClient.get<ApiResponse<KardexResponse>>(`/inventory/products/${productId}/kardex?${buildKardexParams(query).toString()}`);
  return data.data;
}
