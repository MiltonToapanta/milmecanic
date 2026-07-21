import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { env } from '../config/env';
import { useAuthStore } from '../features/auth/store/auth.store';
import type { ApiResponse } from '../types/api';

export const apiClient = axios.create({ baseURL: env.apiUrl });

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    if (status !== 401 || !original || original._retry || original.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    original._retry = true;
    refreshPromise ??= useAuthStore.getState().refreshAccessToken();
    const token = await refreshPromise.finally(() => {
      refreshPromise = null;
    });

    if (!token) {
      useAuthStore.getState().clearSession();
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${token}`;
    return apiClient(original);
  }
);
