export const INITIAL_PERMISSIONS = [
  'users.read',
  'users.create',
  'users.update',
  'users.change-status',
  'users.change-password',
  'customers.read',
  'customers.create',
  'customers.update',
  'customers.change-status',
  'customers.delete',
  'vehicles.read',
  'vehicles.create',
  'vehicles.update',
  'vehicles.change-status',
  'vehicles.delete',
  'appointments.read',
  'appointments.create',
  'appointments.update',
  'appointments.change-status',
  'appointments.delete',
  'roles.read',
  'settings.read',
  'settings.update',
  'audit.read'
] as const;

export type PermissionCode = (typeof INITIAL_PERMISSIONS)[number];
