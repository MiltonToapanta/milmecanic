import { Injectable } from '@nestjs/common';
import { CustomerType, Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { VehicleQueryDto } from '../dto/vehicle-query.dto';

const vehicleSelect = {
  id: true,
  customerId: true,
  plate: true,
  vin: true,
  brand: true,
  model: true,
  year: true,
  color: true,
  engineNumber: true,
  chassisNumber: true,
  fuelType: true,
  transmissionType: true,
  mileage: true,
  notes: true,
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
} satisfies Prisma.VehicleSelect;

type VehicleRecord = Prisma.VehicleGetPayload<{ select: typeof vehicleSelect }>;

export interface VehicleResponse extends Omit<VehicleRecord, 'customer'> {
  customer: {
    id: string;
    displayName: string;
    identification: string;
  };
}

function getCustomerDisplayName(customer: VehicleRecord['customer']): string {
  if (customer.customerType === CustomerType.COMPANY) return customer.businessName ?? 'Empresa sin razón social';
  return `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Cliente sin nombre';
}

function mapVehicle(vehicle: VehicleRecord): VehicleResponse {
  return {
    ...vehicle,
    customer: {
      id: vehicle.customer.id,
      displayName: getCustomerDisplayName(vehicle.customer),
      identification: vehicle.customer.identification
    }
  };
}

@Injectable()
export class VehiclesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: VehicleQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const where = this.buildWhere(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.vehicle.findMany({
        where,
        select: vehicleSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.vehicle.count({ where })
    ]);

    return {
      items: items.map(mapVehicle),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findByCustomerId(customerId: string, query: VehicleQueryDto) {
    return this.findAll({ ...query, customerId });
  }

  async findById(id: string): Promise<VehicleResponse | null> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, deletedAt: null },
      select: vehicleSelect
    });
    return vehicle ? mapVehicle(vehicle) : null;
  }

  findActiveCustomerById(customerId: string) {
    return this.prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null, isActive: true },
      select: { id: true, isActive: true, deletedAt: true }
    });
  }

  findCustomerById(customerId: string) {
    return this.prisma.customer.findFirst({
      where: { id: customerId },
      select: { id: true, isActive: true, deletedAt: true }
    });
  }

  async findByPlate(plate: string, excludeId?: string): Promise<VehicleResponse | null> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { plate, deletedAt: null, id: excludeId ? { not: excludeId } : undefined },
      select: vehicleSelect
    });
    return vehicle ? mapVehicle(vehicle) : null;
  }

  async findByVin(vin: string, excludeId?: string): Promise<VehicleResponse | null> {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { vin, deletedAt: null, id: excludeId ? { not: excludeId } : undefined },
      select: vehicleSelect
    });
    return vehicle ? mapVehicle(vehicle) : null;
  }

  async create(data: Prisma.VehicleCreateInput): Promise<VehicleResponse> {
    const vehicle = await this.prisma.vehicle.create({ data, select: vehicleSelect });
    return mapVehicle(vehicle);
  }

  async update(id: string, data: Prisma.VehicleUpdateInput): Promise<VehicleResponse> {
    const vehicle = await this.prisma.vehicle.update({ where: { id }, data, select: vehicleSelect });
    return mapVehicle(vehicle);
  }

  private buildWhere(query: VehicleQueryDto): Prisma.VehicleWhereInput {
    const search = query.search?.trim();
    return {
      deletedAt: null,
      customerId: query.customerId,
      brand: query.brand ? { contains: query.brand.trim(), mode: 'insensitive' } : undefined,
      fuelType: query.fuelType,
      transmissionType: query.transmissionType,
      isActive: query.isActive,
      OR: search
        ? [
            { plate: { contains: search, mode: 'insensitive' } },
            { vin: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
            { model: { contains: search, mode: 'insensitive' } },
            { customer: { firstName: { contains: search, mode: 'insensitive' } } },
            { customer: { lastName: { contains: search, mode: 'insensitive' } } },
            { customer: { businessName: { contains: search, mode: 'insensitive' } } },
            { customer: { identification: { contains: search, mode: 'insensitive' } } }
          ]
        : undefined
    };
  }
}
