export interface AuthenticatedUser {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
}
