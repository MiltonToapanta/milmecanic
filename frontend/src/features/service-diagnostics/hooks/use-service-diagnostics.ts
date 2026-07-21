import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as serviceDiagnosticsApi from '../api/service-diagnostics.api';
import type { DiagnosticItemPayload, UpdateServiceDiagnosticPayload } from '../types/service-diagnostic.types';

export const serviceDiagnosticKeys = {
  all: ['service-diagnostics'] as const,
  detail: (id: string) => [...serviceDiagnosticKeys.all, 'detail', id] as const,
  byOrder: (serviceOrderId: string) => [...serviceDiagnosticKeys.all, 'service-order', serviceOrderId] as const
};

export function useServiceDiagnostic(id: string) {
  return useQuery({
    queryKey: serviceDiagnosticKeys.detail(id),
    queryFn: () => serviceDiagnosticsApi.getServiceDiagnostic(id),
    enabled: Boolean(id)
  });
}

export function useServiceDiagnosticByOrder(serviceOrderId: string) {
  return useQuery({
    queryKey: serviceDiagnosticKeys.byOrder(serviceOrderId),
    queryFn: () => serviceDiagnosticsApi.getServiceDiagnosticByOrder(serviceOrderId),
    enabled: Boolean(serviceOrderId),
    retry: false
  });
}

export function useCreateServiceDiagnostic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: serviceDiagnosticsApi.createServiceDiagnostic,
    onSuccess: async (diagnostic) => {
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.all });
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.byOrder(diagnostic.serviceOrderId) });
    }
  });
}

export function useUpdateServiceDiagnostic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateServiceDiagnosticPayload }) => serviceDiagnosticsApi.updateServiceDiagnostic(id, payload),
    onSuccess: async (diagnostic) => {
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.all });
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.detail(diagnostic.id) });
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.byOrder(diagnostic.serviceOrderId) });
    }
  });
}

export function useCompleteServiceDiagnostic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: serviceDiagnosticsApi.completeServiceDiagnostic,
    onSuccess: async (diagnostic) => {
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.all });
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.detail(diagnostic.id) });
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.byOrder(diagnostic.serviceOrderId) });
    }
  });
}

export function useDeleteServiceDiagnostic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: serviceDiagnosticsApi.deleteServiceDiagnostic,
    onSuccess: async (diagnostic) => {
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.all });
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.byOrder(diagnostic.serviceOrderId) });
    }
  });
}

export function useAddDiagnosticItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: DiagnosticItemPayload }) => serviceDiagnosticsApi.addDiagnosticItem(id, payload),
    onSuccess: async (diagnostic) => {
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.detail(diagnostic.id) });
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.byOrder(diagnostic.serviceOrderId) });
    }
  });
}

export function useUpdateDiagnosticItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, itemId, payload }: { id: string; itemId: string; payload: DiagnosticItemPayload }) =>
      serviceDiagnosticsApi.updateDiagnosticItem(id, itemId, payload),
    onSuccess: async (diagnostic) => {
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.detail(diagnostic.id) });
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.byOrder(diagnostic.serviceOrderId) });
    }
  });
}

export function useDeleteDiagnosticItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, itemId }: { id: string; itemId: string }) => serviceDiagnosticsApi.deleteDiagnosticItem(id, itemId),
    onSuccess: async (diagnostic) => {
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.detail(diagnostic.id) });
      await queryClient.invalidateQueries({ queryKey: serviceDiagnosticKeys.byOrder(diagnostic.serviceOrderId) });
    }
  });
}
