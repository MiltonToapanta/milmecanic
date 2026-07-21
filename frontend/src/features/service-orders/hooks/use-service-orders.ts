import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as serviceOrdersApi from '../api/service-orders.api';
import type { ChangeServiceOrderStatusPayload, ServiceOrderPayload, ServiceOrderQuery } from '../types/service-order.types';

export const serviceOrderKeys = {
  all: ['service-orders'] as const,
  list: (query: ServiceOrderQuery) => [...serviceOrderKeys.all, 'list', query] as const,
  byCustomer: (customerId: string, query: ServiceOrderQuery) => [...serviceOrderKeys.all, 'customer', customerId, query] as const,
  byVehicle: (vehicleId: string, query: ServiceOrderQuery) => [...serviceOrderKeys.all, 'vehicle', vehicleId, query] as const,
  byUser: (userId: string, query: ServiceOrderQuery) => [...serviceOrderKeys.all, 'user', userId, query] as const,
  detail: (id: string) => [...serviceOrderKeys.all, 'detail', id] as const
};

export function useServiceOrders(query: ServiceOrderQuery) {
  return useQuery({ queryKey: serviceOrderKeys.list(query), queryFn: () => serviceOrdersApi.getServiceOrders(query) });
}

export function useServiceOrdersByCustomer(customerId: string, query: ServiceOrderQuery) {
  return useQuery({
    queryKey: serviceOrderKeys.byCustomer(customerId, query),
    queryFn: () => serviceOrdersApi.getServiceOrdersByCustomer(customerId, query),
    enabled: Boolean(customerId)
  });
}

export function useServiceOrdersByVehicle(vehicleId: string, query: ServiceOrderQuery) {
  return useQuery({
    queryKey: serviceOrderKeys.byVehicle(vehicleId, query),
    queryFn: () => serviceOrdersApi.getServiceOrdersByVehicle(vehicleId, query),
    enabled: Boolean(vehicleId)
  });
}

export function useServiceOrdersByUser(userId: string, query: ServiceOrderQuery) {
  return useQuery({
    queryKey: serviceOrderKeys.byUser(userId, query),
    queryFn: () => serviceOrdersApi.getServiceOrdersByUser(userId, query),
    enabled: Boolean(userId)
  });
}

export function useServiceOrder(id: string) {
  return useQuery({ queryKey: serviceOrderKeys.detail(id), queryFn: () => serviceOrdersApi.getServiceOrder(id), enabled: Boolean(id) });
}

export function useCreateServiceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: serviceOrdersApi.createServiceOrder,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: serviceOrderKeys.all })
  });
}

export function useUpdateServiceOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ServiceOrderPayload }) => serviceOrdersApi.updateServiceOrder(id, payload),
    onSuccess: async (_order, variables) => {
      await queryClient.invalidateQueries({ queryKey: serviceOrderKeys.all });
      await queryClient.invalidateQueries({ queryKey: serviceOrderKeys.detail(variables.id) });
    }
  });
}

export function useChangeServiceOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ChangeServiceOrderStatusPayload }) => serviceOrdersApi.changeServiceOrderStatus(id, payload),
    onSuccess: async (_order, variables) => {
      await queryClient.invalidateQueries({ queryKey: serviceOrderKeys.all });
      await queryClient.invalidateQueries({ queryKey: serviceOrderKeys.detail(variables.id) });
    }
  });
}

export function useDeleteServiceOrder() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: serviceOrdersApi.deleteServiceOrder, onSuccess: async () => queryClient.invalidateQueries({ queryKey: serviceOrderKeys.all }) });
}

export function useUploadServiceOrderPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file, caption }: { id: string; file: File; caption?: string }) => serviceOrdersApi.uploadServiceOrderPhoto(id, file, caption),
    onSuccess: async (_order, variables) => {
      await queryClient.invalidateQueries({ queryKey: serviceOrderKeys.all });
      await queryClient.invalidateQueries({ queryKey: serviceOrderKeys.detail(variables.id) });
    }
  });
}
