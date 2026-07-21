import type { User } from '../../../types/api';

export interface LoginResponse {
  user: User & { permissions: string[] };
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
