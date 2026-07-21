import { apiClient } from '../../../services/api-client';
import type { ApiResponse } from '../../../types/api';
import type {
  Appointment,
  AppointmentListResponse,
  AppointmentPayload,
  AppointmentQuery,
  ChangeAppointmentStatusPayload
} from '../types/appointment.types';

function buildSearchParams(query: AppointmentQuery): URLSearchParams {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.search) params.set('search', query.search);
  if (query.customerId) params.set('customerId', query.customerId);
  if (query.vehicleId) params.set('vehicleId', query.vehicleId);
  if (query.assignedUserId) params.set('assignedUserId', query.assignedUserId);
  if (query.status) params.set('status', query.status);
  if (query.dateFrom) params.set('dateFrom', query.dateFrom);
  if (query.dateTo) params.set('dateTo', query.dateTo);
  return params;
}

export async function getAppointments(query: AppointmentQuery): Promise<AppointmentListResponse> {
  const { data } = await apiClient.get<ApiResponse<AppointmentListResponse>>(`/appointments?${buildSearchParams(query).toString()}`);
  return data.data;
}

export async function getAppointmentsByCustomer(customerId: string, query: AppointmentQuery): Promise<AppointmentListResponse> {
  const { data } = await apiClient.get<ApiResponse<AppointmentListResponse>>(`/customers/${customerId}/appointments?${buildSearchParams(query).toString()}`);
  return data.data;
}

export async function getAppointmentsByVehicle(vehicleId: string, query: AppointmentQuery): Promise<AppointmentListResponse> {
  const { data } = await apiClient.get<ApiResponse<AppointmentListResponse>>(`/vehicles/${vehicleId}/appointments?${buildSearchParams(query).toString()}`);
  return data.data;
}

export async function getAppointment(id: string): Promise<Appointment> {
  const { data } = await apiClient.get<ApiResponse<Appointment>>(`/appointments/${id}`);
  return data.data;
}

export async function createAppointment(payload: AppointmentPayload): Promise<Appointment> {
  const { data } = await apiClient.post<ApiResponse<Appointment>>('/appointments', payload);
  return data.data;
}

export async function updateAppointment(id: string, payload: AppointmentPayload): Promise<Appointment> {
  const { data } = await apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}`, payload);
  return data.data;
}

export async function changeAppointmentStatus(id: string, payload: ChangeAppointmentStatusPayload): Promise<Appointment> {
  const { data } = await apiClient.patch<ApiResponse<Appointment>>(`/appointments/${id}/status`, payload);
  return data.data;
}

export async function deleteAppointment(id: string): Promise<Appointment> {
  const { data } = await apiClient.delete<ApiResponse<Appointment>>(`/appointments/${id}`);
  return data.data;
}
