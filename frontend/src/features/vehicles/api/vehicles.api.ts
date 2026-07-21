import { apiClient } from '../../../services/api-client';
import type { ApiResponse } from '../../../types/api';
import type { Vehicle, VehicleListResponse, VehiclePayload, VehicleQuery } from '../types/vehicle.types';

function buildSearchParams(query: VehicleQuery): URLSearchParams {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.search) params.set('search', query.search);
  if (query.customerId) params.set('customerId', query.customerId);
  if (query.brand) params.set('brand', query.brand);
  if (query.fuelType) params.set('fuelType', query.fuelType);
  if (query.transmissionType) params.set('transmissionType', query.transmissionType);
  if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
  return params;
}

export async function getVehicles(query: VehicleQuery): Promise<VehicleListResponse> {
  const { data } = await apiClient.get<ApiResponse<VehicleListResponse>>(`/vehicles?${buildSearchParams(query).toString()}`);
  return data.data;
}

export async function getVehiclesByCustomer(customerId: string, query: VehicleQuery): Promise<VehicleListResponse> {
  const { data } = await apiClient.get<ApiResponse<VehicleListResponse>>(`/customers/${customerId}/vehicles?${buildSearchParams(query).toString()}`);
  return data.data;
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const { data } = await apiClient.get<ApiResponse<Vehicle>>(`/vehicles/${id}`);
  return data.data;
}

export async function createVehicle(payload: VehiclePayload): Promise<Vehicle> {
  const { data } = await apiClient.post<ApiResponse<Vehicle>>('/vehicles', payload);
  return data.data;
}

export async function updateVehicle(id: string, payload: VehiclePayload): Promise<Vehicle> {
  const { data } = await apiClient.patch<ApiResponse<Vehicle>>(`/vehicles/${id}`, payload);
  return data.data;
}

export async function activateVehicle(id: string): Promise<Vehicle> {
  const { data } = await apiClient.patch<ApiResponse<Vehicle>>(`/vehicles/${id}/activate`);
  return data.data;
}

export async function deactivateVehicle(id: string): Promise<Vehicle> {
  const { data } = await apiClient.patch<ApiResponse<Vehicle>>(`/vehicles/${id}/deactivate`);
  return data.data;
}

export async function deleteVehicle(id: string): Promise<Vehicle> {
  const { data } = await apiClient.delete<ApiResponse<Vehicle>>(`/vehicles/${id}`);
  return data.data;
}
