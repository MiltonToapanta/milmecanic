import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as quotationsApi from '../api/quotations.api';
import type {
  CreateQuotationItemInput,
  CreateQuotationPayload,
  QuotationQuery,
  UpdateQuotationPayload
} from '../types/quotation.types';

export const quotationKeys = {
  all: ['quotations'] as const,
  list: (query: QuotationQuery) => [...quotationKeys.all, 'list', query] as const,
  byServiceOrder: (serviceOrderId: string, query: QuotationQuery) =>
    [...quotationKeys.all, 'service-order', serviceOrderId, query] as const,
  detail: (id: string) => [...quotationKeys.all, 'detail', id] as const
};

export function useQuotations(query: QuotationQuery) {
  return useQuery({
    queryKey: quotationKeys.list(query),
    queryFn: () => quotationsApi.getQuotations(query)
  });
}

export function useQuotationsByServiceOrder(serviceOrderId: string, query: QuotationQuery) {
  return useQuery({
    queryKey: quotationKeys.byServiceOrder(serviceOrderId, query),
    queryFn: () => quotationsApi.getQuotationsByServiceOrder(serviceOrderId, query),
    enabled: Boolean(serviceOrderId)
  });
}

export function useQuotation(id: string) {
  return useQuery({
    queryKey: quotationKeys.detail(id),
    queryFn: () => quotationsApi.getQuotation(id),
    enabled: Boolean(id)
  });
}

export function useCreateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.createQuotation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    }
  });
}

export function useUpdateQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateQuotationPayload }) =>
      quotationsApi.updateQuotation(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      await queryClient.invalidateQueries({ queryKey: quotationKeys.detail(variables.id) });
    }
  });
}

export function useDeleteQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.deleteQuotation,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    }
  });
}

export function useAddQuotationItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CreateQuotationItemInput }) =>
      quotationsApi.addQuotationItem(id, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: quotationKeys.detail(variables.id) });
    }
  });
}

export function useUpdateQuotationItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, itemId, payload }: { id: string; itemId: string; payload: CreateQuotationItemInput }) =>
      quotationsApi.updateQuotationItem(id, itemId, payload),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: quotationKeys.detail(variables.id) });
    }
  });
}

export function useDeleteQuotationItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, itemId }: { id: string; itemId: string }) =>
      quotationsApi.deleteQuotationItem(id, itemId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: quotationKeys.detail(variables.id) });
    }
  });
}

export function useSendQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.sendQuotation,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      await queryClient.invalidateQueries({ queryKey: quotationKeys.detail(variables) });
    }
  });
}

export function useApproveQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.approveQuotation,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      await queryClient.invalidateQueries({ queryKey: quotationKeys.detail(variables) });
    }
  });
}

export function useRejectQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string; rejectionReason: string }) =>
      quotationsApi.rejectQuotation(id, rejectionReason),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      await queryClient.invalidateQueries({ queryKey: quotationKeys.detail(variables.id) });
    }
  });
}

export function useCancelQuotation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: quotationsApi.cancelQuotation,
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      await queryClient.invalidateQueries({ queryKey: quotationKeys.detail(variables) });
    }
  });
}
