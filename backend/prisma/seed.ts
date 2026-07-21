import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const roles = [
  { name: 'Administrador', description: 'Acceso completo al sistema' },
  { name: 'Asesor de servicio', description: 'Gestiona recepción y atención de servicio' },
  { name: 'Mecánico', description: 'Ejecuta diagnósticos y reparaciones' },
  { name: 'Bodega', description: 'Administra repuestos e insumos' },
  { name: 'Caja', description: 'Gestiona cobros e ingresos internos' }
];

const permissions = [
  ['users.read', 'Ver usuarios', 'users'],
  ['users.create', 'Crear usuarios', 'users'],
  ['users.update', 'Actualizar usuarios', 'users'],
  ['users.change-status', 'Activar o desactivar usuarios', 'users'],
  ['users.change-password', 'Cambiar contraseñas', 'users'],
  ['customers.read', 'Ver clientes', 'customers'],
  ['customers.create', 'Crear clientes', 'customers'],
  ['customers.update', 'Actualizar clientes', 'customers'],
  ['customers.change-status', 'Activar o desactivar clientes', 'customers'],
  ['customers.delete', 'Eliminar clientes', 'customers'],
  ['vehicles.read', 'Ver vehículos', 'vehicles'],
  ['vehicles.create', 'Crear vehículos', 'vehicles'],
  ['vehicles.update', 'Actualizar vehículos', 'vehicles'],
  ['vehicles.change-status', 'Activar o desactivar vehículos', 'vehicles'],
  ['vehicles.delete', 'Eliminar vehículos', 'vehicles'],
  ['appointments.read', 'Ver citas', 'appointments'],
  ['appointments.create', 'Crear citas', 'appointments'],
  ['appointments.update', 'Actualizar citas', 'appointments'],
  ['appointments.change-status', 'Cambiar estado de citas', 'appointments'],
  ['appointments.delete', 'Eliminar citas', 'appointments'],
  ['roles.read', 'Ver roles y permisos', 'roles'],
  ['settings.read', 'Ver configuración del taller', 'settings'],
  ['settings.update', 'Actualizar configuración del taller', 'settings'],
  ['audit.read', 'Ver auditoría', 'audit']
] as const;

const developmentUsers = [
  {
    firstName: 'Super',
    lastName: 'Usuario',
    email: 'super@milmecanic.local',
    phone: '0990000001',
    roleName: 'Administrador'
  },
  {
    firstName: 'Sofía',
    lastName: 'Andrade',
    email: 'asesor@milmecanic.local',
    phone: '0990000002',
    roleName: 'Asesor de servicio'
  },
  {
    firstName: 'Diego',
    lastName: 'Mecánico',
    email: 'mecanico@milmecanic.local',
    phone: '0990000003',
    roleName: 'Mecánico'
  },
  {
    firstName: 'Laura',
    lastName: 'Bodega',
    email: 'bodega@milmecanic.local',
    phone: '0990000004',
    roleName: 'Bodega'
  },
  {
    firstName: 'Mateo',
    lastName: 'Caja',
    email: 'caja@milmecanic.local',
    phone: '0990000005',
    roleName: 'Caja'
  }
] as const;

async function main(): Promise<void> {
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: role,
      create: role
    });
  }

  for (const [code, name, module] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { name, module },
      create: { code, name, module }
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Administrador' } });
  const allPermissions = await prisma.permission.findMany();

  for (const permission of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id
      }
    });
  }

  const serviceAdvisorRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Asesor de servicio' } });
  const serviceAdvisorPermissionCodes = ['appointments.read', 'appointments.create', 'appointments.update'];
  const serviceAdvisorPermissions = await prisma.permission.findMany({ where: { code: { in: serviceAdvisorPermissionCodes } } });
  for (const permission of serviceAdvisorPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: serviceAdvisorRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: serviceAdvisorRole.id,
        permissionId: permission.id
      }
    });
  }

  const passwordHash = await bcrypt.hash('Admin123*', 12);
  await prisma.user.upsert({
    where: { email: 'admin@milmecanic.local' },
    update: {
      firstName: 'Administrador',
      lastName: 'General',
      passwordHash,
      roleId: adminRole.id,
      isActive: true
    },
    create: {
      firstName: 'Administrador',
      lastName: 'General',
      email: 'admin@milmecanic.local',
      passwordHash,
      roleId: adminRole.id,
      isActive: true
    }
  });

  for (const user of developmentUsers) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: user.roleName } });
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        passwordHash,
        roleId: role.id,
        isActive: true,
        deletedAt: null
      },
      create: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        passwordHash,
        roleId: role.id,
        isActive: true
      }
    });
  }

  const existingSetting = await prisma.workshopSetting.findFirst({ where: { deletedAt: null } });
  if (!existingSetting) {
    await prisma.workshopSetting.create({
      data: {
        tradeName: 'MilMecanic Taller',
        currency: 'USD',
        timezone: 'America/Guayaquil',
        serviceOrderPrefix: 'OT',
        quotationPrefix: 'COT',
        internalInvoicePrefix: 'FAC'
      }
    });
  }

  console.log('Seed completed. Development users use password: Admin123*');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
