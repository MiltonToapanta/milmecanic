import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as customersApi from '../api/customers.api';
import type { CustomerPayload, CustomerQuery } from '../types/customer.types';

export const customerKeys = {
  all: ['customers'] as const,
  list: (query: CustomerQuery) => [...customerKeys.all, 'list', query] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const
};

export function useCustomers(query: CustomerQuery) {
  return useQuery({
    queryKey: customerKeys.list(query),
    queryFn: () => customersApi.getCustomers(query)
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.getCustomer(id),
    enabled: Boolean(id)
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.createCustomer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
    }
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerPayload }) => customersApi.updateCustomer(id, payload),
    onSuccess: async (_customer, variables) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      await queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
    }
  });
}

export function useActivateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.activateCustomer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
    }
  });
}

export function useDeactivateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.deactivateCustomer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
    }
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customersApi.deleteCustomer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
    }
  });
}
