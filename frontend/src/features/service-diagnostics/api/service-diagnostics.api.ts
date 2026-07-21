import { AxiosError } from 'axios';
import { apiClient } from '../../../services/api-client';
import type { ApiResponse } from '../../../types/api';
import type {
  DiagnosticItemPayload,
  ServiceDiagnostic,
  ServiceDiagnosticPayload,
  UpdateServiceDiagnosticPayload
} from '../types/service-diagnostic.types';

export async function createServiceDiagnostic(payload: ServiceDiagnosticPayload): Promise<ServiceDiagnostic> {
  const { data } = await apiClient.post<ApiResponse<ServiceDiagnostic>>('/service-diagnostics', payload);
  return data.data;
}

export async function getServiceDiagnostic(id: string): Promise<ServiceDiagnostic> {
  const { data } = await apiClient.get<ApiResponse<ServiceDiagnostic>>(`/service-diagnostics/${id}`);
  return data.data;
}

export async function getServiceDiagnosticByOrder(serviceOrderId: string): Promise<ServiceDiagnostic | null> {
  try {
    const { data } = await apiClient.get<ApiResponse<ServiceDiagnostic>>(`/service-orders/${serviceOrderId}/diagnostic`);
    return data.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) return null;
    throw error;
  }
}

export async function updateServiceDiagnostic(id: string, payload: UpdateServiceDiagnosticPayload): Promise<ServiceDiagnostic> {
  const { data } = await apiClient.patch<ApiResponse<ServiceDiagnostic>>(`/service-diagnostics/${id}`, payload);
  return data.data;
}

export async function completeServiceDiagnostic(id: string): Promise<ServiceDiagnostic> {
  const { data } = await apiClient.patch<ApiResponse<ServiceDiagnostic>>(`/service-diagnostics/${id}/complete`);
  return data.data;
}

export async function deleteServiceDiagnostic(id: string): Promise<ServiceDiagnostic> {
  const { data } = await apiClient.delete<ApiResponse<ServiceDiagnostic>>(`/service-diagnostics/${id}`);
  return data.data;
}

export async function addDiagnosticItem(id: string, payload: DiagnosticItemPayload): Promise<ServiceDiagnostic> {
  const { data } = await apiClient.post<ApiResponse<ServiceDiagnostic>>(`/service-diagnostics/${id}/items`, payload);
  return data.data;
}

export async function updateDiagnosticItem(id: string, itemId: string, payload: DiagnosticItemPayload): Promise<ServiceDiagnostic> {
  const { data } = await apiClient.patch<ApiResponse<ServiceDiagnostic>>(`/service-diagnostics/${id}/items/${itemId}`, payload);
  return data.data;
}

export async function deleteDiagnosticItem(id: string, itemId: string): Promise<ServiceDiagnostic> {
  const { data } = await apiClient.delete<ApiResponse<ServiceDiagnostic>>(`/service-diagnostics/${id}/items/${itemId}`);
  return data.data;
}
