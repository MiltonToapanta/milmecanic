import { apiClient } from '../../../services/api-client';
import type { ApiResponse } from '../../../types/api';
import type {
  ChangeServiceOrderStatusPayload,
  ServiceOrder,
  ServiceOrderListResponse,
  ServiceOrderPayload,
  ServiceOrderQuery
} from '../types/service-order.types';

function buildSearchParams(query: ServiceOrderQuery): URLSearchParams {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.search) params.set('search', query.search);
  if (query.customerId) params.set('customerId', query.customerId);
  if (query.vehicleId) params.set('vehicleId', query.vehicleId);
  if (query.appointmentId) params.set('appointmentId', query.appointmentId);
  if (query.assignedAdvisorId) params.set('assignedAdvisorId', query.assignedAdvisorId);
  if (query.assignedMechanicId) params.set('assignedMechanicId', query.assignedMechanicId);
  if (query.status) params.set('status', query.status);
  if (query.dateFrom) params.set('dateFrom', query.dateFrom);
  if (query.dateTo) params.set('dateTo', query.dateTo);
  if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
  return params;
}

export async function getServiceOrders(query: ServiceOrderQuery): Promise<ServiceOrderListResponse> {
  const { data } = await apiClient.get<ApiResponse<ServiceOrderListResponse>>(`/service-orders?${buildSearchParams(query).toString()}`);
  return data.data;
}

export async function getServiceOrdersByCustomer(customerId: string, query: ServiceOrderQuery): Promise<ServiceOrderListResponse> {
  const { data } = await apiClient.get<ApiResponse<ServiceOrderListResponse>>(`/customers/${customerId}/service-orders?${buildSearchParams(query).toString()}`);
  return data.data;
}

export async function getServiceOrdersByVehicle(vehicleId: string, query: ServiceOrderQuery): Promise<ServiceOrderListResponse> {
  const { data } = await apiClient.get<ApiResponse<ServiceOrderListResponse>>(`/vehicles/${vehicleId}/service-orders?${buildSearchParams(query).toString()}`);
  return data.data;
}

export async function getServiceOrdersByUser(userId: string, query: ServiceOrderQuery): Promise<ServiceOrderListResponse> {
  const { data } = await apiClient.get<ApiResponse<ServiceOrderListResponse>>(`/users/${userId}/service-orders?${buildSearchParams(query).toString()}`);
  return data.data;
}

export async function getServiceOrder(id: string): Promise<ServiceOrder> {
  const { data } = await apiClient.get<ApiResponse<ServiceOrder>>(`/service-orders/${id}`);
  return data.data;
}

export async function downloadServiceOrderPdf(id: string): Promise<Blob> {
  const { data } = await apiClient.get<Blob>(`/service-orders/${id}/pdf`, { responseType: 'blob' });
  return data;
}

export async function createServiceOrder(payload: ServiceOrderPayload): Promise<ServiceOrder> {
  const { data } = await apiClient.post<ApiResponse<ServiceOrder>>('/service-orders', payload);
  return data.data;
}

export async function updateServiceOrder(id: string, payload: ServiceOrderPayload): Promise<ServiceOrder> {
  const { data } = await apiClient.patch<ApiResponse<ServiceOrder>>(`/service-orders/${id}`, payload);
  return data.data;
}

export async function changeServiceOrderStatus(id: string, payload: ChangeServiceOrderStatusPayload): Promise<ServiceOrder> {
  const { data } = await apiClient.patch<ApiResponse<ServiceOrder>>(`/service-orders/${id}/status`, payload);
  return data.data;
}

export async function deleteServiceOrder(id: string): Promise<ServiceOrder> {
  const { data } = await apiClient.delete<ApiResponse<ServiceOrder>>(`/service-orders/${id}`);
  return data.data;
}

export async function uploadServiceOrderPhoto(id: string, file: File, caption?: string): Promise<ServiceOrder> {
  const formData = new FormData();
  formData.append('photo', file);
  if (caption) formData.append('caption', caption);
  const { data } = await apiClient.post<ApiResponse<ServiceOrder>>(`/service-orders/${id}/photos`, formData);
  return data.data;
}
