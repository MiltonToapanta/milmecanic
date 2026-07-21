import { Injectable } from '@nestjs/common';
import { AppointmentStatus, CustomerType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ServiceOrderQueryDto } from '../dto/service-order-query.dto';

const userSummarySelect = {
  id: true,
  firstName: true,
  lastName: true
} satisfies Prisma.UserSelect;

const serviceOrderSelect = {
  id: true,
  orderNumber: true,
  customerId: true,
  vehicleId: true,
  appointmentId: true,
  assignedAdvisorId: true,
  assignedMechanicId: true,
  status: true,
  reportedMileage: true,
  fuelLevel: true,
  customerRequest: true,
  initialDiagnosis: true,
  internalNotes: true,
  exteriorCondition: true,
  interiorCondition: true,
  receivedAccessories: true,
  customerSignatureName: true,
  workshopSignatureName: true,
  estimatedDeliveryAt: true,
  startedAt: true,
  completedAt: true,
  deliveredAt: true,
  cancellationReason: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  customer: {
    select: {
      id: true,
      customerType: true,
      firstName: true,
      lastName: true,
      businessName: true,
      identification: true
    }
  },
  vehicle: {
    select: {
      id: true,
      plate: true,
      brand: true,
      model: true
    }
  },
  appointment: {
    select: {
      id: true,
      scheduledAt: true,
      reason: true,
      status: true
    }
  },
  assignedAdvisor: { select: userSummarySelect },
  assignedMechanic: { select: userSummarySelect },
  photos: {
    where: { deletedAt: null },
    select: {
      id: true,
      fileName: true,
      originalName: true,
      mimeType: true,
      size: true,
      url: true,
      caption: true,
      createdAt: true
    },
    orderBy: { createdAt: 'asc' }
  }
} satisfies Prisma.ServiceOrderSelect;

type ServiceOrderRecord = Prisma.ServiceOrderGetPayload<{ select: typeof serviceOrderSelect }>;

export interface ServiceOrderResponse
  extends Omit<ServiceOrderRecord, 'customer' | 'vehicle' | 'appointment' | 'assignedAdvisor' | 'assignedMechanic'> {
  customer: {
    id: string;
    displayName: string;
    identification: string;
  };
  vehicle: {
    id: string;
    plate: string;
    displayName: string;
  };
  appointment: {
    id: string;
    scheduledAt: Date;
    reason: string;
    status: AppointmentStatus;
  } | null;
  assignedAdvisor: UserSummary | null;
  assignedMechanic: UserSummary | null;
}

export interface ServiceOrderPhotoInput {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  caption?: string;
}

interface UserSummary {
  id: string;
  displayName: string;
}

export interface CreateServiceOrderTransactionalInput {
  data: Omit<Prisma.ServiceOrderCreateInput, 'orderNumber'>;
  prefix: string;
}

@Injectable()
export class ServiceOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ServiceOrderQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const where = this.buildWhere(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.serviceOrder.findMany({
        where,
        select: serviceOrderSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.serviceOrder.count({ where })
    ]);

    return {
      items: items.map(mapServiceOrder),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id: string): Promise<ServiceOrderResponse | null> {
    const serviceOrder = await this.prisma.serviceOrder.findFirst({
      where: { id, deletedAt: null },
      select: serviceOrderSelect
    });
    return serviceOrder ? mapServiceOrder(serviceOrder) : null;
  }

  async findByUserId(userId: string, query: ServiceOrderQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const where: Prisma.ServiceOrderWhereInput = {
      AND: [this.buildWhere(query), { OR: [{ assignedAdvisorId: userId }, { assignedMechanicId: userId }] }]
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.serviceOrder.findMany({
        where,
        select: serviceOrderSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.serviceOrder.count({ where })
    ]);

    return {
      items: items.map(mapServiceOrder),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async createTransactional(input: CreateServiceOrderTransactionalInput): Promise<ServiceOrderResponse> {
    const serviceOrder = await this.prisma.$transaction(async (tx) => {
      const counter = await tx.serviceOrderCounter.upsert({
        where: { prefix: input.prefix },
        update: { currentNumber: { increment: 1 } },
        create: { prefix: input.prefix, currentNumber: 1 }
      });

      return tx.serviceOrder.create({
        data: {
          ...input.data,
          orderNumber: `${input.prefix}-${counter.currentNumber.toString().padStart(6, '0')}`
        },
        select: serviceOrderSelect
      });
    });

    return mapServiceOrder(serviceOrder);
  }

  async update(id: string, data: Prisma.ServiceOrderUpdateInput): Promise<ServiceOrderResponse> {
    const serviceOrder = await this.prisma.serviceOrder.update({
      where: { id },
      data,
      select: serviceOrderSelect
    });
    return mapServiceOrder(serviceOrder);
  }

  async addPhoto(serviceOrderId: string, input: ServiceOrderPhotoInput): Promise<ServiceOrderResponse> {
    await this.prisma.serviceOrderPhoto.create({
      data: {
        serviceOrderId,
        fileName: input.fileName,
        originalName: input.originalName,
        mimeType: input.mimeType,
        size: input.size,
        url: input.url,
        caption: input.caption
      }
    });
    const serviceOrder = await this.findById(serviceOrderId);
    if (!serviceOrder) throw new Error('Service order not found after photo upload');
    return serviceOrder;
  }

  findActiveCustomerById(customerId: string) {
    return this.prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null, isActive: true },
      select: { id: true, isActive: true, deletedAt: true }
    });
  }

  findActiveVehicleById(vehicleId: string) {
    return this.prisma.vehicle.findFirst({
      where: { id: vehicleId, deletedAt: null, isActive: true },
      select: { id: true, customerId: true, isActive: true, deletedAt: true }
    });
  }

  findActiveUserById(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null, isActive: true },
      select: { id: true, isActive: true, deletedAt: true }
    });
  }

  findUsableAppointmentById(appointmentId: string) {
    return this.prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        deletedAt: null,
        status: { not: AppointmentStatus.CANCELLED }
      },
      select: {
        id: true,
        customerId: true,
        vehicleId: true,
        status: true,
        deletedAt: true
      }
    });
  }

  async getServiceOrderPrefix(): Promise<string> {
    const setting = await this.prisma.workshopSetting.findFirst({
      where: { deletedAt: null },
      select: { serviceOrderPrefix: true },
      orderBy: { createdAt: 'asc' }
    });
    return setting?.serviceOrderPrefix?.trim() || 'OT';
  }

  private buildWhere(query: ServiceOrderQueryDto): Prisma.ServiceOrderWhereInput {
    const search = query.search?.trim();
    return {
      deletedAt: null,
      customerId: query.customerId,
      vehicleId: query.vehicleId,
      appointmentId: query.appointmentId,
      assignedAdvisorId: query.assignedAdvisorId,
      assignedMechanicId: query.assignedMechanicId,
      status: query.status,
      isActive: query.isActive,
      createdAt: {
        gte: query.dateFrom,
        lte: query.dateTo
      },
      OR: search
        ? [
            { orderNumber: { contains: search, mode: 'insensitive' } },
            { customerRequest: { contains: search, mode: 'insensitive' } },
            { customer: { identification: { contains: search, mode: 'insensitive' } } },
            { customer: { firstName: { contains: search, mode: 'insensitive' } } },
            { customer: { lastName: { contains: search, mode: 'insensitive' } } },
            { customer: { businessName: { contains: search, mode: 'insensitive' } } },
            { vehicle: { plate: { contains: search, mode: 'insensitive' } } },
            { vehicle: { brand: { contains: search, mode: 'insensitive' } } },
            { vehicle: { model: { contains: search, mode: 'insensitive' } } }
          ]
        : undefined
    };
  }
}

function getCustomerDisplayName(customer: ServiceOrderRecord['customer']): string {
  if (customer.customerType === CustomerType.COMPANY) return customer.businessName ?? 'Empresa sin razón social';
  return `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Cliente sin nombre';
}

function mapUser(user: ServiceOrderRecord['assignedAdvisor']): UserSummary | null {
  if (!user) return null;
  return {
    id: user.id,
    displayName: `${user.firstName} ${user.lastName}`.trim()
  };
}

function mapServiceOrder(serviceOrder: ServiceOrderRecord): ServiceOrderResponse {
  return {
    ...serviceOrder,
    customer: {
      id: serviceOrder.customer.id,
      displayName: getCustomerDisplayName(serviceOrder.customer),
      identification: serviceOrder.customer.identification
    },
    vehicle: {
      id: serviceOrder.vehicle.id,
      plate: serviceOrder.vehicle.plate,
      displayName: `${serviceOrder.vehicle.brand} ${serviceOrder.vehicle.model}`.trim()
    },
    appointment: serviceOrder.appointment,
    assignedAdvisor: mapUser(serviceOrder.assignedAdvisor),
    assignedMechanic: mapUser(serviceOrder.assignedMechanic)
  };
}
