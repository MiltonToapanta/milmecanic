import { apiClient } from '../../../services/api-client';
import type { ApiResponse, User } from '../../../types/api';
import type { LoginInput, LoginResponse } from '../types/auth.types';

export async function login(input: LoginInput): Promise<LoginResponse> {
  const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', input);
  return data.data;
}

export async function refresh(refreshToken: string): Promise<Pick<LoginResponse, 'accessToken' | 'refreshToken'>> {
  const { data } = await apiClient.post<ApiResponse<Pick<LoginResponse, 'accessToken' | 'refreshToken'>>>('/auth/refresh', { refreshToken });
  return data.data;
}

export async function logout(refreshToken?: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function me(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
  return data.data;
}
