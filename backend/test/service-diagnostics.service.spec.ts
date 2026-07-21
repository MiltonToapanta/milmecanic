import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import {
  DiagnosticCategory,
  DiagnosticItemStatus,
  DiagnosticSeverity,
  ServiceOrderStatus,
} from "@prisma/client";
import { ServiceDiagnosticsService } from "../src/modules/service-diagnostics/services/service-diagnostics.service";

const serviceOrder = {
  id: "service-order-id",
  status: ServiceOrderStatus.DIAGNOSIS,
  deletedAt: null,
};

const diagnosticItem = {
  id: "item-id",
  diagnosticId: "diagnostic-id",
  category: DiagnosticCategory.BRAKES,
  itemName: "Pastillas delanteras",
  status: DiagnosticItemStatus.BAD,
  observation: "Desgaste severo",
  severity: DiagnosticSeverity.HIGH,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const diagnostic = {
  id: "diagnostic-id",
  serviceOrderId: "service-order-id",
  generalObservation: "Revisión técnica inicial",
  recommendation: "Cotizar frenos",
  completedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  serviceOrder: {
    id: "service-order-id",
    orderNumber: "OT-000001",
    status: ServiceOrderStatus.DIAGNOSIS,
    customer: {
      id: "customer-id",
      displayName: "Carlos Mora",
      identification: "0102030405",
    },
    vehicle: {
      id: "vehicle-id",
      plate: "PBA1234",
      displayName: "Toyota Corolla",
    },
  },
  items: [diagnosticItem],
};

describe("ServiceDiagnosticsService", () => {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    findActiveByServiceOrderId: jest.fn(),
    findActiveServiceOrderById: jest.fn(),
    update: jest.fn(),
    addItem: jest.fn(),
    findItemById: jest.fn(),
    updateItem: jest.fn(),
    softDeleteItem: jest.fn(),
  };
  const audit = { log: jest.fn() };
  let service: ServiceDiagnosticsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ServiceDiagnosticsService(
      repository as never,
      audit as never,
    );
  });

  it("creates a diagnostic correctly", async () => {
    repository.findActiveServiceOrderById.mockResolvedValue(serviceOrder);
    repository.findActiveByServiceOrderId.mockResolvedValue(null);
    repository.create.mockResolvedValue(diagnostic);

    const result = await service.create(
      {
        serviceOrderId: "service-order-id",
        generalObservation: "Revisión técnica inicial",
        recommendation: "Cotizar frenos",
        items: [
          {
            category: DiagnosticCategory.BRAKES,
            itemName: "Pastillas delanteras",
            status: DiagnosticItemStatus.BAD,
            observation: "Desgaste severo",
            severity: DiagnosticSeverity.HIGH,
          },
        ],
      },
      "actor-id",
    );

    expect(result.id).toBe("diagnostic-id");
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceOrder: { connect: { id: "service-order-id" } },
      }),
    );
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "create",
        module: "service-diagnostics",
      }),
    );
  });

  it("rejects missing service order", async () => {
    repository.findActiveServiceOrderById.mockResolvedValue(null);

    await expect(
      service.create({ serviceOrderId: "missing-id", items: [validItem()] }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects delivered service order", async () => {
    repository.findActiveServiceOrderById.mockResolvedValue({
      ...serviceOrder,
      status: ServiceOrderStatus.DELIVERED,
    });

    await expect(
      service.create({
        serviceOrderId: "service-order-id",
        items: [validItem()],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects cancelled service order", async () => {
    repository.findActiveServiceOrderById.mockResolvedValue({
      ...serviceOrder,
      status: ServiceOrderStatus.CANCELLED,
    });

    await expect(
      service.create({
        serviceOrderId: "service-order-id",
        items: [validItem()],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects a second active diagnostic for the same order", async () => {
    repository.findActiveServiceOrderById.mockResolvedValue(serviceOrder);
    repository.findActiveByServiceOrderId.mockResolvedValue(diagnostic);

    await expect(
      service.create({
        serviceOrderId: "service-order-id",
        items: [validItem()],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects diagnostic without items", async () => {
    repository.findActiveServiceOrderById.mockResolvedValue(serviceOrder);
    repository.findActiveByServiceOrderId.mockResolvedValue(null);

    await expect(
      service.create({ serviceOrderId: "service-order-id", items: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects bad item without observation", async () => {
    repository.findActiveServiceOrderById.mockResolvedValue(serviceOrder);
    repository.findActiveByServiceOrderId.mockResolvedValue(null);

    await expect(
      service.create({
        serviceOrderId: "service-order-id",
        items: [
          {
            ...validItem(),
            status: DiagnosticItemStatus.BAD,
            observation: undefined,
            severity: DiagnosticSeverity.HIGH,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects bad item without severity", async () => {
    repository.findActiveServiceOrderById.mockResolvedValue(serviceOrder);
    repository.findActiveByServiceOrderId.mockResolvedValue(null);

    await expect(
      service.create({
        serviceOrderId: "service-order-id",
        items: [
          {
            ...validItem(),
            status: DiagnosticItemStatus.BAD,
            observation: "Falla visible",
            severity: undefined,
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("gets diagnostic by service order", async () => {
    repository.findActiveByServiceOrderId.mockResolvedValue(diagnostic);

    await expect(
      service.findByServiceOrderId("service-order-id"),
    ).resolves.toEqual(diagnostic);
  });

  it("updates a diagnostic", async () => {
    repository.findById.mockResolvedValue(diagnostic);
    repository.update.mockResolvedValue({
      ...diagnostic,
      recommendation: "Cambiar pastillas",
    });

    const result = await service.update(
      "diagnostic-id",
      { recommendation: "Cambiar pastillas" },
      "actor-id",
    );
    expect(result.recommendation).toBe("Cambiar pastillas");
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "update" }),
    );
  });

  it("adds an item", async () => {
    repository.findById.mockResolvedValue(diagnostic);
    repository.addItem.mockResolvedValue({
      ...diagnostic,
      items: [...diagnostic.items, { ...validItem(), id: "new-item-id" }],
    });

    const result = await service.addItem(
      "diagnostic-id",
      { ...validItem(), itemName: "Discos delanteros" },
      "actor-id",
    );
    expect(result.items).toHaveLength(2);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "create-item" }),
    );
  });

  it("updates an item", async () => {
    repository.findById.mockResolvedValue(diagnostic);
    repository.findItemById.mockResolvedValue(diagnosticItem);
    repository.updateItem.mockResolvedValue({
      ...diagnostic,
      items: [
        {
          ...diagnosticItem,
          status: DiagnosticItemStatus.REGULAR,
          severity: DiagnosticSeverity.MEDIUM,
        },
      ],
    });

    const result = await service.updateItem(
      "diagnostic-id",
      "item-id",
      {
        status: DiagnosticItemStatus.REGULAR,
        severity: DiagnosticSeverity.MEDIUM,
      },
      "actor-id",
    );
    expect(result.items[0].status).toBe(DiagnosticItemStatus.REGULAR);
  });

  it("soft deletes an item", async () => {
    repository.findById.mockResolvedValue(diagnostic);
    repository.findItemById.mockResolvedValue(diagnosticItem);
    repository.softDeleteItem.mockResolvedValue({ ...diagnostic, items: [] });

    const result = await service.softDeleteItem(
      "diagnostic-id",
      "item-id",
      "actor-id",
    );
    expect(result.items).toHaveLength(0);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "delete-item" }),
    );
  });

  it("completes a diagnostic", async () => {
    repository.findById.mockResolvedValue(diagnostic);
    repository.update.mockResolvedValue({
      ...diagnostic,
      completedAt: new Date(),
    });

    const result = await service.complete("diagnostic-id", "actor-id");
    expect(result.completedAt).toBeInstanceOf(Date);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "complete" }),
    );
  });

  it("blocks changes after completion", async () => {
    repository.findById.mockResolvedValue({
      ...diagnostic,
      completedAt: new Date(),
    });

    await expect(
      service.update("diagnostic-id", { recommendation: "No editar" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function validItem() {
  return {
    category: DiagnosticCategory.ENGINE,
    itemName: "Aceite de motor",
    status: DiagnosticItemStatus.GOOD,
    observation: "Nivel correcto",
    severity: undefined,
  };
}
