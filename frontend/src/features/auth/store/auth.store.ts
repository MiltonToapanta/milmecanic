import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../../../types/api';
import * as authApi from '../api/auth.api';
import type { LoginInput } from '../types/auth.types';

interface AuthState {
  user: (User & { permissions?: string[] }) | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  loadCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
  clearSession: () => void;
  hasPermission: (permission: string) => boolean;
}

function normalizeUserPermissions(user: User & { permissions?: string[] }): User & { permissions: string[] } {
  return {
    ...user,
    permissions: user.permissions ?? user.role.rolePermissions?.map((rolePermission) => rolePermission.permission.code) ?? []
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      async login(input) {
        const response = await authApi.login(input);
        set({ user: normalizeUserPermissions(response.user), accessToken: response.accessToken, refreshToken: response.refreshToken, isAuthenticated: true });
      },
      async refreshAccessToken() {
        const token = get().refreshToken;
        if (!token) return null;
        try {
          const response = await authApi.refresh(token);
          set({ accessToken: response.accessToken, refreshToken: response.refreshToken, isAuthenticated: true });
          return response.accessToken;
        } catch {
          get().clearSession();
          return null;
        }
      },
      async loadCurrentUser() {
        const user = await authApi.me();
        set({ user: normalizeUserPermissions(user), isAuthenticated: true });
      },
      async logout() {
        const token = get().refreshToken ?? undefined;
        try {
          await authApi.logout(token);
        } finally {
          get().clearSession();
        }
      },
      clearSession() {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
      hasPermission(permission) {
        return get().user?.permissions?.includes(permission) ?? false;
      }
    }),
    {
      name: 'milmecanic-session',
      partialize: (state) => ({ refreshToken: state.refreshToken })
    }
  )
);
