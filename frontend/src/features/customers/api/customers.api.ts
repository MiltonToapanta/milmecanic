import { apiClient } from '../../../services/api-client';
import type { ApiResponse } from '../../../types/api';
import type { Customer, CustomerListResponse, CustomerPayload, CustomerQuery } from '../types/customer.types';

function buildSearchParams(query: CustomerQuery): URLSearchParams {
  const params = new URLSearchParams({
    page: String(query.page),
    limit: String(query.limit)
  });
  if (query.search) params.set('search', query.search);
  if (query.customerType) params.set('customerType', query.customerType);
  if (query.identificationType) params.set('identificationType', query.identificationType);
  if (query.isActive !== undefined) params.set('isActive', String(query.isActive));
  return params;
}

export async function getCustomers(query: CustomerQuery): Promise<CustomerListResponse> {
  const { data } = await apiClient.get<ApiResponse<CustomerListResponse>>(`/customers?${buildSearchParams(query).toString()}`);
  return data.data;
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await apiClient.get<ApiResponse<Customer>>(`/customers/${id}`);
  return data.data;
}

export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  const { data } = await apiClient.post<ApiResponse<Customer>>('/customers', payload);
  return data.data;
}

export async function updateCustomer(id: string, payload: CustomerPayload): Promise<Customer> {
  const { data } = await apiClient.patch<ApiResponse<Customer>>(`/customers/${id}`, payload);
  return data.data;
}

export async function activateCustomer(id: string): Promise<Customer> {
  const { data } = await apiClient.patch<ApiResponse<Customer>>(`/customers/${id}/activate`);
  return data.data;
}

export async function deactivateCustomer(id: string): Promise<Customer> {
  const { data } = await apiClient.patch<ApiResponse<Customer>>(`/customers/${id}/deactivate`);
  return data.data;
}

export async function deleteCustomer(id: string): Promise<Customer> {
  const { data } = await apiClient.delete<ApiResponse<Customer>>(`/customers/${id}`);
  return data.data;
}
