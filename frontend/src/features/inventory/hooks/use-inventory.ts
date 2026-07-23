import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as inventoryApi from '../api/inventory.api';
import type {
  InventoryCategoryPayload,
  InventoryFilters,
  InventoryProductPayload,
  StockMovementPayload,
  StockMovementQuery,
  WarehousePayload
} from '../types/inventory.types';

export const inventoryKeys = {
  products: ['inventory-products'] as const,
  productList: (query: InventoryFilters) => [...inventoryKeys.products, 'list', query] as const,
  productDetail: (id: string) => ['inventory-product-detail', id] as const,
  categories: ['inventory-categories'] as const,
  warehouses: ['inventory-warehouses'] as const,
  stock: ['inventory-stock'] as const,
  stockList: (query: InventoryFilters) => [...inventoryKeys.stock, 'list', query] as const,
  warehouseStock: (warehouseId: string, query: InventoryFilters) => ['inventory-warehouse-stock', warehouseId, query] as const,
  movements: ['inventory-movements'] as const,
  kardex: (productId: string, query: StockMovementQuery) => ['inventory-kardex', productId, query] as const
};

export function useInventoryProducts(query: InventoryFilters) {
  return useQuery({ queryKey: inventoryKeys.productList(query), queryFn: () => inventoryApi.getInventoryProducts(query) });
}

export function useInventoryProduct(id: string) {
  return useQuery({ queryKey: inventoryKeys.productDetail(id), queryFn: () => inventoryApi.getInventoryProduct(id), enabled: Boolean(id) });
}

export function useCreateInventoryProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InventoryProductPayload) => inventoryApi.createInventoryProduct(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.products });
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.stock });
    }
  });
}

export function useUpdateInventoryProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InventoryProductPayload }) => inventoryApi.updateInventoryProduct(id, payload),
    onSuccess: async (_product, variables) => {
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.products });
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.productDetail(variables.id) });
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.stock });
    }
  });
}

export function useDeleteInventoryProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.deleteInventoryProduct,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.products });
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.stock });
    }
  });
}

export function useInventoryCategories(query: { search?: string; isActive?: boolean } = {}) {
  return useQuery({ queryKey: [...inventoryKeys.categories, query], queryFn: () => inventoryApi.getInventoryCategories(query) });
}

export function useCreateInventoryCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InventoryCategoryPayload) => inventoryApi.createInventoryCategory(payload),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: inventoryKeys.categories })
  });
}

export function useUpdateInventoryCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: InventoryCategoryPayload }) => inventoryApi.updateInventoryCategory(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.categories });
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.products });
    }
  });
}

export function useDeleteInventoryCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.deleteInventoryCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.categories });
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.products });
    }
  });
}

export function useWarehouses(query: { search?: string; isActive?: boolean } = {}) {
  return useQuery({ queryKey: [...inventoryKeys.warehouses, query], queryFn: () => inventoryApi.getWarehouses(query) });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WarehousePayload) => inventoryApi.createWarehouse(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses });
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.stock });
    }
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: WarehousePayload }) => inventoryApi.updateWarehouse(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses });
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.stock });
    }
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: inventoryApi.deleteWarehouse,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.warehouses });
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.stock });
    }
  });
}

export function useInventoryStock(query: InventoryFilters) {
  return useQuery({ queryKey: inventoryKeys.stockList(query), queryFn: () => inventoryApi.getInventoryStock(query) });
}

export function useProductKardex(productId: string, query: StockMovementQuery) {
  return useQuery({ queryKey: inventoryKeys.kardex(productId, query), queryFn: () => inventoryApi.getProductKardex(productId, query), enabled: Boolean(productId) });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockMovementPayload) => inventoryApi.createStockMovement(payload),
    onSuccess: async (_movement, variables) => {
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.products });
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.productDetail(variables.productId) });
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.stock });
      await queryClient.invalidateQueries({ queryKey: inventoryKeys.movements });
      await queryClient.invalidateQueries({ queryKey: ['inventory-warehouse-stock'] });
      await queryClient.invalidateQueries({ queryKey: ['inventory-kardex'] });
    }
  });
}
