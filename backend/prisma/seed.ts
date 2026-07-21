import { AppointmentStatus, CustomerType, FuelLevel, FuelType, IdentificationType, PrismaClient, ServiceOrderStatus, TransmissionType } from '@prisma/client';
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
  ['service-orders.read', 'Ver órdenes de servicio', 'service-orders'],
  ['service-orders.create', 'Crear órdenes de servicio', 'service-orders'],
  ['service-orders.update', 'Actualizar órdenes de servicio', 'service-orders'],
  ['service-orders.change-status', 'Cambiar estado de órdenes de servicio', 'service-orders'],
  ['service-orders.delete', 'Eliminar órdenes de servicio', 'service-orders'],
  ['service-diagnostics.read', 'Ver diagnósticos técnicos', 'service-diagnostics'],
  ['service-diagnostics.create', 'Crear diagnósticos técnicos', 'service-diagnostics'],
  ['service-diagnostics.update', 'Actualizar diagnósticos técnicos', 'service-diagnostics'],
  ['service-diagnostics.complete', 'Completar diagnósticos técnicos', 'service-diagnostics'],
  ['service-diagnostics.delete', 'Eliminar diagnósticos técnicos', 'service-diagnostics'],
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

const demoCustomers = [
  {
    customerType: CustomerType.PERSON,
    identificationType: IdentificationType.CEDULA,
    identification: '1700001001',
    firstName: 'Carlos',
    lastName: 'Mora',
    email: 'carlos.mora@demo.milmecanic.local',
    phone: '0991112233',
    city: 'Quito',
    address: 'Av. América N32-40',
    notes: 'Cliente demo. Prefiere confirmación por WhatsApp.'
  },
  {
    customerType: CustomerType.PERSON,
    identificationType: IdentificationType.CEDULA,
    identification: '1700001002',
    firstName: 'María',
    lastName: 'Paredes',
    email: 'maria.paredes@demo.milmecanic.local',
    phone: '0982223344',
    city: 'Quito',
    address: 'La Carolina, calle Japón',
    notes: 'Cliente demo. Solicita revisar frenos antes de viajes.'
  },
  {
    customerType: CustomerType.COMPANY,
    identificationType: IdentificationType.RUC,
    identification: '1790012345001',
    businessName: 'Transporte Andino Demo S.A.',
    email: 'operaciones@andino.demo.milmecanic.local',
    phone: '022555100',
    city: 'Quito',
    address: 'Parque industrial norte',
    notes: 'Empresa demo con flota liviana.'
  }
] as const;

const demoVehicles = [
  {
    customerIdentification: '1700001001',
    plate: 'PBA1234',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2021,
    color: 'Blanco',
    fuelType: FuelType.GASOLINE,
    transmissionType: TransmissionType.AUTOMATIC,
    mileage: 48200,
    notes: 'Vehículo demo para citas de mantenimiento.'
  },
  {
    customerIdentification: '1700001002',
    plate: 'PCB5678',
    brand: 'Kia',
    model: 'Sportage',
    year: 2022,
    color: 'Gris',
    fuelType: FuelType.GASOLINE,
    transmissionType: TransmissionType.AUTOMATIC,
    mileage: 31800,
    notes: 'Vehículo demo con revisión de frenos.'
  },
  {
    customerIdentification: '1790012345001',
    plate: 'PCT9012',
    brand: 'Chevrolet',
    model: 'D-Max',
    year: 2020,
    color: 'Azul',
    fuelType: FuelType.DIESEL,
    transmissionType: TransmissionType.MANUAL,
    mileage: 92500,
    notes: 'Camioneta demo de flota empresarial.'
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
  const serviceAdvisorPermissionCodes = [
    'appointments.read',
    'appointments.create',
    'appointments.update',
    'appointments.change-status',
    'service-orders.read',
    'service-orders.create',
    'service-orders.update',
    'service-orders.change-status',
    'service-diagnostics.read',
    'service-diagnostics.create',
    'service-diagnostics.update',
    'service-diagnostics.complete'
  ];
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

  const mechanicRole = await prisma.role.findUniqueOrThrow({ where: { name: 'Mecánico' } });
  const mechanicPermissionCodes = [
    'service-orders.read',
    'service-orders.update',
    'service-orders.change-status',
    'service-diagnostics.read',
    'service-diagnostics.create',
    'service-diagnostics.update',
    'service-diagnostics.complete'
  ];
  const mechanicPermissions = await prisma.permission.findMany({ where: { code: { in: mechanicPermissionCodes } } });
  for (const permission of mechanicPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: mechanicRole.id,
          permissionId: permission.id
        }
      },
      update: {},
      create: {
        roleId: mechanicRole.id,
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

  const adminUser = await prisma.user.findUniqueOrThrow({ where: { email: 'super@milmecanic.local' } });
  const advisorUser = await prisma.user.findUniqueOrThrow({ where: { email: 'asesor@milmecanic.local' } });
  const mechanicUser = await prisma.user.findUniqueOrThrow({ where: { email: 'mecanico@milmecanic.local' } });

  for (const customer of demoCustomers) {
    const existingCustomer = await prisma.customer.findFirst({
      where: { identification: customer.identification, deletedAt: null }
    });
    const data = {
      customerType: customer.customerType,
      identificationType: customer.identificationType,
      identification: customer.identification,
      firstName: customer.customerType === CustomerType.PERSON ? customer.firstName : null,
      lastName: customer.customerType === CustomerType.PERSON ? customer.lastName : null,
      businessName: customer.customerType === CustomerType.COMPANY ? customer.businessName : null,
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      address: customer.address,
      notes: customer.notes,
      isActive: true,
      createdById: adminUser.id,
      updatedById: adminUser.id
    };
    if (existingCustomer) {
      await prisma.customer.update({ where: { id: existingCustomer.id }, data });
    } else {
      await prisma.customer.create({ data });
    }
  }

  for (const vehicle of demoVehicles) {
    const customer = await prisma.customer.findFirstOrThrow({
      where: { identification: vehicle.customerIdentification, deletedAt: null }
    });
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { plate: vehicle.plate, deletedAt: null }
    });
    const data = {
      customerId: customer.id,
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      fuelType: vehicle.fuelType,
      transmissionType: vehicle.transmissionType,
      mileage: vehicle.mileage,
      notes: vehicle.notes,
      isActive: true,
      createdById: adminUser.id,
      updatedById: adminUser.id
    };
    if (existingVehicle) {
      await prisma.vehicle.update({ where: { id: existingVehicle.id }, data });
    } else {
      await prisma.vehicle.create({ data });
    }
  }

  const appointmentSeeds = [
    {
      plate: 'PBA1234',
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      estimatedDurationMinutes: 60,
      reason: 'Mantenimiento preventivo de 50.000 km',
      status: AppointmentStatus.SCHEDULED,
      notes: 'Cita demo: revisar aceite, filtros y niveles.'
    },
    {
      plate: 'PCB5678',
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      estimatedDurationMinutes: 90,
      reason: 'Diagnóstico de frenos',
      status: AppointmentStatus.CONFIRMED,
      notes: 'Cita demo confirmada por teléfono.'
    },
    {
      plate: 'PCT9012',
      scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      estimatedDurationMinutes: 120,
      reason: 'Revisión de suspensión y tren delantero',
      status: AppointmentStatus.COMPLETED,
      notes: 'Cita demo completada para historial.'
    }
  ] as const;

  for (const appointment of appointmentSeeds) {
    const vehicle = await prisma.vehicle.findFirstOrThrow({
      where: { plate: appointment.plate, deletedAt: null },
      include: { customer: true }
    });
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        vehicleId: vehicle.id,
        reason: appointment.reason,
        deletedAt: null
      }
    });
    const data = {
      customerId: vehicle.customerId,
      vehicleId: vehicle.id,
      assignedUserId: advisorUser.id,
      scheduledAt: appointment.scheduledAt,
      estimatedDurationMinutes: appointment.estimatedDurationMinutes,
      reason: appointment.reason,
      status: appointment.status,
      notes: appointment.notes,
      createdById: adminUser.id,
      updatedById: adminUser.id
    };
    if (existingAppointment) {
      await prisma.appointment.update({ where: { id: existingAppointment.id }, data });
    } else {
      await prisma.appointment.create({ data });
    }
  }

  const serviceOrderSeeds = [
    {
      plate: 'PBA1234',
      customerRequest: 'Mantenimiento preventivo completo y revisión general antes de viaje.',
      initialDiagnosis: 'Unidad recibida para revisión de aceite, filtros, frenos y niveles.',
      internalNotes: 'Orden demo en diagnóstico.',
      reportedMileage: 48200,
      fuelLevel: FuelLevel.HALF,
      status: ServiceOrderStatus.DIAGNOSIS
    },
    {
      plate: 'PCB5678',
      customerRequest: 'Ruido al frenar y vibración leve en el volante.',
      initialDiagnosis: 'Se recomienda inspección de pastillas, discos y alineación.',
      internalNotes: 'Orden demo aprobada para revisión de frenos.',
      reportedMileage: 31800,
      fuelLevel: FuelLevel.THREE_QUARTERS,
      status: ServiceOrderStatus.APPROVED
    }
  ] as const;

  const setting = await prisma.workshopSetting.findFirst({ where: { deletedAt: null } });
  const serviceOrderPrefix = setting?.serviceOrderPrefix ?? 'OT';

  for (const serviceOrderSeed of serviceOrderSeeds) {
    const vehicle = await prisma.vehicle.findFirstOrThrow({
      where: { plate: serviceOrderSeed.plate, deletedAt: null },
      include: { customer: true }
    });
    const appointment = await prisma.appointment.findFirst({
      where: { vehicleId: vehicle.id, deletedAt: null },
      orderBy: { scheduledAt: 'asc' }
    });
    const existingServiceOrder = await prisma.serviceOrder.findFirst({
      where: {
        vehicleId: vehicle.id,
        customerRequest: serviceOrderSeed.customerRequest,
        deletedAt: null
      }
    });
    const data = {
      customerId: vehicle.customerId,
      vehicleId: vehicle.id,
      appointmentId: appointment?.id,
      assignedAdvisorId: advisorUser.id,
      assignedMechanicId: mechanicUser.id,
      reportedMileage: serviceOrderSeed.reportedMileage,
      fuelLevel: serviceOrderSeed.fuelLevel,
      status: serviceOrderSeed.status,
      customerRequest: serviceOrderSeed.customerRequest,
      initialDiagnosis: serviceOrderSeed.initialDiagnosis,
      internalNotes: serviceOrderSeed.internalNotes,
      isActive: true,
      createdById: adminUser.id,
      updatedById: adminUser.id
    };

    if (existingServiceOrder) {
      await prisma.serviceOrder.update({ where: { id: existingServiceOrder.id }, data });
    } else {
      const counter = await prisma.serviceOrderCounter.upsert({
        where: { prefix: serviceOrderPrefix },
        update: { currentNumber: { increment: 1 } },
        create: { prefix: serviceOrderPrefix, currentNumber: 1 }
      });
      await prisma.serviceOrder.create({
        data: {
          ...data,
          orderNumber: `${serviceOrderPrefix}-${counter.currentNumber.toString().padStart(6, '0')}`
        }
      });
    }
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
