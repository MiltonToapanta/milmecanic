import { Injectable } from '@nestjs/common';
import { CustomerType, Prisma, QuotationStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { QuotationQueryDto } from '../dto/quotation-query.dto';

const quotationItemSelect = {
  id: true,
  itemType: true,
  description: true,
  quantity: true,
  unitPrice: true,
  discount: true,
  taxRate: true,
  subtotal: true,
  tax: true,
  total: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.QuotationItemSelect;

const quotationSelect = {
  id: true,
  quotationNumber: true,
  serviceOrderId: true,
  status: true,
  subtotal: true,
  discount: true,
  tax: true,
  total: true,
  validUntil: true,
  notes: true,
  approvedAt: true,
  rejectedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  serviceOrder: {
    select: {
      id: true,
      orderNumber: true,
      status: true,
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
      }
    }
  },
  items: {
    where: { deletedAt: null },
    select: quotationItemSelect,
    orderBy: { createdAt: 'asc' }
  }
} satisfies Prisma.QuotationSelect;

type QuotationRecord = Prisma.QuotationGetPayload<{ select: typeof quotationSelect }>;

export interface QuotationResponse {
  id: string;
  quotationNumber: string;
  serviceOrderId: string;
  status: QuotationStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil: Date | null;
  notes: string | null;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  serviceOrder: {
    id: string;
    orderNumber: string;
    status: string;
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
  };
  items: Array<{
    id: string;
    itemType: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
    subtotal: number;
    tax: number;
    total: number;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

@Injectable()
export class QuotationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuotationQueryDto) {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quotation.findMany({
        where,
        select: quotationSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.quotation.count({ where })
    ]);

    return {
      items: items.map(mapQuotation),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findByServiceOrderId(serviceOrderId: string, query: QuotationQueryDto) {
    const where: Prisma.QuotationWhereInput = {
      ...this.buildWhere(query),
      serviceOrderId
    };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.quotation.findMany({
        where,
        select: quotationSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.quotation.count({ where })
    ]);

    return {
      items: items.map(mapQuotation),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id: string): Promise<QuotationResponse | null> {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, deletedAt: null },
      select: quotationSelect
    });
    return quotation ? mapQuotation(quotation) : null;
  }

  async findActiveByServiceOrderId(serviceOrderId: string, statuses: QuotationStatus[]) {
    return this.prisma.quotation.findFirst({
      where: {
        serviceOrderId,
        status: { in: statuses },
        deletedAt: null
      },
      select: { id: true, status: true }
    });
  }

  async createTransactional(data: {
    quotationData: Omit<Prisma.QuotationCreateInput, 'quotationNumber'>;
    itemsData: Array<Omit<Prisma.QuotationItemCreateInput, 'quotation'>>;
    prefix: string;
  }): Promise<QuotationResponse> {
    const quotation = await this.prisma.$transaction(async (tx) => {
      const counter = await tx.quotationCounter.upsert({
        where: { prefix: data.prefix },
        update: { currentNumber: { increment: 1 } },
        create: { prefix: data.prefix, currentNumber: 1 }
      });

      return tx.quotation.create({
        data: {
          ...data.quotationData,
          quotationNumber: `${data.prefix}-${counter.currentNumber.toString().padStart(6, '0')}`,
          items: {
            create: data.itemsData
          }
        },
        select: quotationSelect
      });
    });

    return mapQuotation(quotation);
  }

  async update(id: string, data: Prisma.QuotationUpdateInput): Promise<QuotationResponse> {
    const quotation = await this.prisma.quotation.update({
      where: { id },
      data,
      select: quotationSelect
    });
    return mapQuotation(quotation);
  }

  async addItem(
    quotationId: string,
    data: Omit<Prisma.QuotationItemCreateInput, 'quotation'>
  ): Promise<QuotationResponse> {
    await this.prisma.quotationItem.create({
      data: {
        ...data,
        quotation: { connect: { id: quotationId } }
      }
    });
    const quotation = await this.findById(quotationId);
    if (!quotation) throw new Error('Quotation not found after adding item');
    return quotation;
  }

  async updateItem(itemId: string, data: Prisma.QuotationItemUpdateInput): Promise<void> {
    await this.prisma.quotationItem.update({
      where: { id: itemId },
      data
    });
  }

  async softDeleteItem(itemId: string): Promise<void> {
    await this.prisma.quotationItem.update({
      where: { id: itemId },
      data: { deletedAt: new Date() }
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.quotation.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  findServiceOrderById(serviceOrderId: string) {
    return this.prisma.serviceOrder.findFirst({
      where: { id: serviceOrderId, deletedAt: null },
      select: { id: true, status: true, deletedAt: true }
    });
  }

  async getQuotationPrefix(): Promise<string> {
    const setting = await this.prisma.workshopSetting.findFirst({
      where: { deletedAt: null },
      select: { quotationPrefix: true },
      orderBy: { createdAt: 'asc' }
    });
    return setting?.quotationPrefix?.trim() || 'COT';
  }

  private buildWhere(query: QuotationQueryDto): Prisma.QuotationWhereInput {
    const search = query.search?.trim();
    return {
      deletedAt: null,
      serviceOrderId: query.serviceOrderId,
      status: query.status,
      createdAt: {
        gte: query.dateFrom,
        lte: query.dateTo
      },
      OR: search
        ? [
            { quotationNumber: { contains: search, mode: 'insensitive' } },
            {
              serviceOrder: {
                orderNumber: { contains: search, mode: 'insensitive' }
              }
            },
            {
              serviceOrder: {
                customer: {
                  identification: { contains: search, mode: 'insensitive' }
                }
              }
            },
            {
              serviceOrder: {
                customer: {
                  firstName: { contains: search, mode: 'insensitive' }
                }
              }
            },
            {
              serviceOrder: {
                customer: {
                  lastName: { contains: search, mode: 'insensitive' }
                }
              }
            },
            {
              serviceOrder: {
                customer: {
                  businessName: { contains: search, mode: 'insensitive' }
                }
              }
            },
            {
              serviceOrder: {
                vehicle: { plate: { contains: search, mode: 'insensitive' } }
              }
            },
            {
              items: {
                some: {
                  description: { contains: search, mode: 'insensitive' },
                  deletedAt: null
                }
              }
            }
          ]
        : undefined
    };
  }
}

function getCustomerDisplayName(customer: QuotationRecord['serviceOrder']['customer']): string {
  if (customer.customerType === CustomerType.COMPANY) return customer.businessName ?? 'Empresa sin razón social';
  return `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim() || 'Cliente sin nombre';
}

function mapQuotation(quotation: QuotationRecord): QuotationResponse {
  return {
    id: quotation.id,
    quotationNumber: quotation.quotationNumber,
    serviceOrderId: quotation.serviceOrderId,
    status: quotation.status,
    subtotal: quotation.subtotal.toNumber(),
    discount: quotation.discount.toNumber(),
    tax: quotation.tax.toNumber(),
    total: quotation.total.toNumber(),
    validUntil: quotation.validUntil,
    notes: quotation.notes,
    approvedAt: quotation.approvedAt,
    rejectedAt: quotation.rejectedAt,
    rejectionReason: quotation.rejectionReason,
    createdAt: quotation.createdAt,
    updatedAt: quotation.updatedAt,
    serviceOrder: {
      id: quotation.serviceOrder.id,
      orderNumber: quotation.serviceOrder.orderNumber,
      status: quotation.serviceOrder.status,
      customer: {
        id: quotation.serviceOrder.customer.id,
        displayName: getCustomerDisplayName(quotation.serviceOrder.customer),
        identification: quotation.serviceOrder.customer.identification
      },
      vehicle: {
        id: quotation.serviceOrder.vehicle.id,
        plate: quotation.serviceOrder.vehicle.plate,
        displayName: `${quotation.serviceOrder.vehicle.brand} ${quotation.serviceOrder.vehicle.model}`.trim()
      }
    },
    items: quotation.items.map((item) => ({
      id: item.id,
      itemType: item.itemType,
      description: item.description,
      quantity: item.quantity.toNumber(),
      unitPrice: item.unitPrice.toNumber(),
      discount: item.discount.toNumber(),
      taxRate: item.taxRate.toNumber(),
      subtotal: item.subtotal.toNumber(),
      tax: item.tax.toNumber(),
      total: item.total.toNumber(),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }))
  };
}
