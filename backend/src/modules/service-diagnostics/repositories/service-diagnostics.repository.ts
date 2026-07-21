import { Injectable } from "@nestjs/common";
import { CustomerType, Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma/prisma.service";

const serviceDiagnosticSelect = {
  id: true,
  serviceOrderId: true,
  generalObservation: true,
  recommendation: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
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
          identification: true,
        },
      },
      vehicle: {
        select: {
          id: true,
          plate: true,
          brand: true,
          model: true,
        },
      },
    },
  },
  items: {
    where: { deletedAt: null },
    select: {
      id: true,
      diagnosticId: true,
      category: true,
      itemName: true,
      status: true,
      observation: true,
      severity: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
    orderBy: [{ category: "asc" }, { itemName: "asc" }],
  },
} satisfies Prisma.ServiceDiagnosticSelect;

type ServiceDiagnosticRecord = Prisma.ServiceDiagnosticGetPayload<{
  select: typeof serviceDiagnosticSelect;
}>;

export type ServiceDiagnosticResponse = ReturnType<typeof mapServiceDiagnostic>;
export type ServiceDiagnosticItemResponse =
  ServiceDiagnosticResponse["items"][number];

@Injectable()
export class ServiceDiagnosticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.ServiceDiagnosticCreateInput,
  ): Promise<ServiceDiagnosticResponse> {
    const diagnostic = await this.prisma.serviceDiagnostic.create({
      data,
      select: serviceDiagnosticSelect,
    });
    return mapServiceDiagnostic(diagnostic);
  }

  async findById(id: string): Promise<ServiceDiagnosticResponse | null> {
    const diagnostic = await this.prisma.serviceDiagnostic.findFirst({
      where: { id, deletedAt: null },
      select: serviceDiagnosticSelect,
    });
    return diagnostic ? mapServiceDiagnostic(diagnostic) : null;
  }

  async findActiveByServiceOrderId(
    serviceOrderId: string,
  ): Promise<ServiceDiagnosticResponse | null> {
    const diagnostic = await this.prisma.serviceDiagnostic.findFirst({
      where: { serviceOrderId, deletedAt: null },
      select: serviceDiagnosticSelect,
    });
    return diagnostic ? mapServiceDiagnostic(diagnostic) : null;
  }

  findActiveServiceOrderById(serviceOrderId: string) {
    return this.prisma.serviceOrder.findFirst({
      where: { id: serviceOrderId, deletedAt: null },
      select: { id: true, status: true, deletedAt: true },
    });
  }

  async update(
    id: string,
    data: Prisma.ServiceDiagnosticUpdateInput,
  ): Promise<ServiceDiagnosticResponse> {
    const diagnostic = await this.prisma.serviceDiagnostic.update({
      where: { id },
      data,
      select: serviceDiagnosticSelect,
    });
    return mapServiceDiagnostic(diagnostic);
  }

  async addItem(
    diagnosticId: string,
    data: Prisma.ServiceDiagnosticItemCreateWithoutDiagnosticInput,
  ): Promise<ServiceDiagnosticResponse> {
    const diagnostic = await this.prisma.$transaction(async (tx) => {
      await tx.serviceDiagnosticItem.create({
        data: {
          ...data,
          diagnostic: { connect: { id: diagnosticId } },
        },
      });
      return tx.serviceDiagnostic.findUniqueOrThrow({
        where: { id: diagnosticId },
        select: serviceDiagnosticSelect,
      });
    });
    return mapServiceDiagnostic(diagnostic);
  }

  async findItemById(
    diagnosticId: string,
    itemId: string,
  ): Promise<ServiceDiagnosticItemResponse | null> {
    const diagnostic = await this.findById(diagnosticId);
    return diagnostic?.items.find((item) => item.id === itemId) ?? null;
  }

  async updateItem(
    diagnosticId: string,
    itemId: string,
    data: Prisma.ServiceDiagnosticItemUpdateInput,
  ): Promise<ServiceDiagnosticResponse> {
    const diagnostic = await this.prisma.$transaction(async (tx) => {
      await tx.serviceDiagnosticItem.update({
        where: { id: itemId },
        data,
      });
      return tx.serviceDiagnostic.findUniqueOrThrow({
        where: { id: diagnosticId },
        select: serviceDiagnosticSelect,
      });
    });
    return mapServiceDiagnostic(diagnostic);
  }

  async softDeleteItem(
    diagnosticId: string,
    itemId: string,
  ): Promise<ServiceDiagnosticResponse> {
    const diagnostic = await this.prisma.$transaction(async (tx) => {
      await tx.serviceDiagnosticItem.update({
        where: { id: itemId },
        data: { deletedAt: new Date() },
      });
      return tx.serviceDiagnostic.findUniqueOrThrow({
        where: { id: diagnosticId },
        select: serviceDiagnosticSelect,
      });
    });
    return mapServiceDiagnostic(diagnostic);
  }
}

function getCustomerDisplayName(
  customer: ServiceDiagnosticRecord["serviceOrder"]["customer"],
): string {
  if (customer.customerType === CustomerType.COMPANY)
    return customer.businessName ?? "Empresa sin razón social";
  return (
    `${customer.firstName ?? ""} ${customer.lastName ?? ""}`.trim() ||
    "Cliente sin nombre"
  );
}

function mapServiceDiagnostic(diagnostic: ServiceDiagnosticRecord) {
  return {
    ...diagnostic,
    serviceOrder: {
      id: diagnostic.serviceOrder.id,
      orderNumber: diagnostic.serviceOrder.orderNumber,
      status: diagnostic.serviceOrder.status,
      customer: {
        id: diagnostic.serviceOrder.customer.id,
        displayName: getCustomerDisplayName(diagnostic.serviceOrder.customer),
        identification: diagnostic.serviceOrder.customer.identification,
      },
      vehicle: {
        id: diagnostic.serviceOrder.vehicle.id,
        plate: diagnostic.serviceOrder.vehicle.plate,
        displayName:
          `${diagnostic.serviceOrder.vehicle.brand} ${diagnostic.serviceOrder.vehicle.model}`.trim(),
      },
    },
  };
}
