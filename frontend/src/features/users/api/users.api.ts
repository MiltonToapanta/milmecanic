import { apiClient } from '../../../services/api-client';
import type { ApiResponse, User } from '../../../types/api';

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: string;
  phone?: string;
}

export async function getUsers(): Promise<User[]> {
  const { data } = await apiClient.get<ApiResponse<User[]>>('/users');
  return data.data;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await apiClient.post<ApiResponse<User>>('/users', input);
  return data.data;
}
