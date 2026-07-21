import { Injectable } from '@nestjs/common';
import { CustomerType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { AppointmentQueryDto } from '../dto/appointment-query.dto';

const appointmentSelect = {
  id: true,
  customerId: true,
  vehicleId: true,
  assignedUserId: true,
  scheduledAt: true,
  estimatedDurationMinutes: true,
  reason: true,
  notes: true,
  status: true,
  cancellationReason: true,
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
  assignedUser: {
    select: {
      id: true,
      firstName: true,
      lastName: true
    }
  },
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  },
  updatedBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true
    }
  }
} satisfies Prisma.AppointmentSelect;

type AppointmentRecord = Prisma.AppointmentGetPayload<{ select: typeof appointmentSelect }>;

export interface AppointmentResponse extends Omit<AppointmentRecord, 'customer' | 'vehicle' | 'assignedUser'> {
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
  assignedUser: {
    id: string;
    displayName: string;
  } | null;
}

function getCustomerDisplayName(customer: AppointmentRecord['customer']): string {
  if (customer.customerType === CustomerType.COMPANY) return customer.businessName ?? 'Empresa sin razón social';
  return `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Cliente sin nombre';
}

function mapAppointment(appointment: AppointmentRecord): AppointmentResponse {
  return {
    ...appointment,
    customer: {
      id: appointment.customer.id,
      displayName: getCustomerDisplayName(appointment.customer),
      identification: appointment.customer.identification
    },
    vehicle: {
      id: appointment.vehicle.id,
      plate: appointment.vehicle.plate,
      displayName: `${appointment.vehicle.brand} ${appointment.vehicle.model}`.trim()
    },
    assignedUser: appointment.assignedUser
      ? {
          id: appointment.assignedUser.id,
          displayName: `${appointment.assignedUser.firstName} ${appointment.assignedUser.lastName}`.trim()
        }
      : null
  };
}

@Injectable()
export class AppointmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AppointmentQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const where = this.buildWhere(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where,
        select: appointmentSelect,
        orderBy: { scheduledAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.appointment.count({ where })
    ]);

    return {
      items: items.map(mapAppointment),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id: string): Promise<AppointmentResponse | null> {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, deletedAt: null },
      select: appointmentSelect
    });
    return appointment ? mapAppointment(appointment) : null;
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

  async create(data: Prisma.AppointmentCreateInput): Promise<AppointmentResponse> {
    const appointment = await this.prisma.appointment.create({ data, select: appointmentSelect });
    return mapAppointment(appointment);
  }

  async update(id: string, data: Prisma.AppointmentUpdateInput): Promise<AppointmentResponse> {
    const appointment = await this.prisma.appointment.update({ where: { id }, data, select: appointmentSelect });
    return mapAppointment(appointment);
  }

  private buildWhere(query: AppointmentQueryDto): Prisma.AppointmentWhereInput {
    const search = query.search?.trim();
    return {
      deletedAt: null,
      customerId: query.customerId,
      vehicleId: query.vehicleId,
      assignedUserId: query.assignedUserId,
      status: query.status,
      scheduledAt: {
        gte: query.dateFrom,
        lte: query.dateTo
      },
      OR: search
        ? [
            { customer: { firstName: { contains: search, mode: 'insensitive' } } },
            { customer: { lastName: { contains: search, mode: 'insensitive' } } },
            { customer: { businessName: { contains: search, mode: 'insensitive' } } },
            { customer: { identification: { contains: search, mode: 'insensitive' } } },
            { vehicle: { plate: { contains: search, mode: 'insensitive' } } },
            { vehicle: { brand: { contains: search, mode: 'insensitive' } } },
            { vehicle: { model: { contains: search, mode: 'insensitive' } } },
            { reason: { contains: search, mode: 'insensitive' } }
          ]
        : undefined
    };
  }
}
