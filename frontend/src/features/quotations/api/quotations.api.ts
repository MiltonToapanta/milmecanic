import { apiClient } from '../../../services/api-client';
import type { ApiResponse } from '../../../types/api';
import type {
  CreateQuotationItemInput,
  CreateQuotationPayload,
  Quotation,
  QuotationListResponse,
  QuotationQuery,
  UpdateQuotationPayload
} from '../types/quotation.types';

function buildSearchParams(query: QuotationQuery): URLSearchParams {
  const params = new URLSearchParams({ page: String(query.page), limit: String(query.limit) });
  if (query.search) params.set('search', query.search);
  if (query.serviceOrderId) params.set('serviceOrderId', query.serviceOrderId);
  if (query.status) params.set('status', query.status);
  if (query.dateFrom) params.set('dateFrom', query.dateFrom);
  if (query.dateTo) params.set('dateTo', query.dateTo);
  return params;
}

export async function getQuotations(query: QuotationQuery): Promise<QuotationListResponse> {
  const { data } = await apiClient.get<ApiResponse<QuotationListResponse>>(`/quotations?${buildSearchParams(query).toString()}`);
  return data.data;
}

export async function getQuotation(id: string): Promise<Quotation> {
  const { data } = await apiClient.get<ApiResponse<Quotation>>(`/quotations/${id}`);
  return data.data;
}

export async function getQuotationsByServiceOrder(serviceOrderId: string, query: QuotationQuery): Promise<QuotationListResponse> {
  const { data } = await apiClient.get<ApiResponse<QuotationListResponse>>(`/service-orders/${serviceOrderId}/quotations?${buildSearchParams(query).toString()}`);
  return data.data;
}

export async function createQuotation(payload: CreateQuotationPayload): Promise<Quotation> {
  const { data } = await apiClient.post<ApiResponse<Quotation>>('/quotations', payload);
  return data.data;
}

export async function updateQuotation(id: string, payload: UpdateQuotationPayload): Promise<Quotation> {
  const { data } = await apiClient.patch<ApiResponse<Quotation>>(`/quotations/${id}`, payload);
  return data.data;
}

export async function deleteQuotation(id: string): Promise<void> {
  await apiClient.delete(`/quotations/${id}`);
}

export async function addQuotationItem(id: string, payload: CreateQuotationItemInput): Promise<Quotation> {
  const { data } = await apiClient.post<ApiResponse<Quotation>>(`/quotations/${id}/items`, payload);
  return data.data;
}

export async function updateQuotationItem(id: string, itemId: string, payload: CreateQuotationItemInput): Promise<Quotation> {
  const { data } = await apiClient.patch<ApiResponse<Quotation>>(`/quotations/${id}/items/${itemId}`, payload);
  return data.data;
}

export async function deleteQuotationItem(id: string, itemId: string): Promise<Quotation> {
  const { data } = await apiClient.delete<ApiResponse<Quotation>>(`/quotations/${id}/items/${itemId}`);
  return data.data;
}

export async function sendQuotation(id: string): Promise<Quotation> {
  const { data } = await apiClient.patch<ApiResponse<Quotation>>(`/quotations/${id}/send`);
  return data.data;
}

export async function approveQuotation(id: string): Promise<Quotation> {
  const { data } = await apiClient.patch<ApiResponse<Quotation>>(`/quotations/${id}/approve`);
  return data.data;
}

export async function rejectQuotation(id: string, rejectionReason: string): Promise<Quotation> {
  const { data } = await apiClient.patch<ApiResponse<Quotation>>(`/quotations/${id}/reject`, { rejectionReason });
  return data.data;
}

export async function cancelQuotation(id: string): Promise<Quotation> {
  const { data } = await apiClient.patch<ApiResponse<Quotation>>(`/quotations/${id}/cancel`);
  return data.data;
}
