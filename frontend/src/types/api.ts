export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface Role {
  id: string;
  name: string;
  rolePermissions?: { permission: Permission }[];
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  roleId: string;
  role: Role;
  permissions?: string[];
}
