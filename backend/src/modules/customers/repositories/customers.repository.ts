import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CustomerQueryDto } from '../dto/customer-query.dto';

export const customerSafeSelect = {
  id: true,
  customerType: true,
  identificationType: true,
  identification: true,
  firstName: true,
  lastName: true,
  businessName: true,
  email: true,
  phone: true,
  secondaryPhone: true,
  address: true,
  city: true,
  notes: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
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
} satisfies Prisma.CustomerSelect;

@Injectable()
export class CustomersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: CustomerQueryDto) {
    const page = query.page;
    const limit = query.limit;
    const where = this.buildWhere(query);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        select: customerSafeSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.customer.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  findById(id: string) {
    return this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      select: customerSafeSelect
    });
  }

  findByIdentification(identification: string, excludeId?: string) {
    return this.prisma.customer.findFirst({
      where: {
        identification,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined
      },
      select: customerSafeSelect
    });
  }

  create(data: Prisma.CustomerCreateInput) {
    return this.prisma.customer.create({ data, select: customerSafeSelect });
  }

  update(id: string, data: Prisma.CustomerUpdateInput) {
    return this.prisma.customer.update({ where: { id }, data, select: customerSafeSelect });
  }

  private buildWhere(query: CustomerQueryDto): Prisma.CustomerWhereInput {
    const search = query.search?.trim();
    return {
      deletedAt: null,
      customerType: query.customerType,
      identificationType: query.identificationType,
      isActive: query.isActive,
      OR: search
        ? [
            { identification: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { businessName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
        : undefined
    };
  }
}
