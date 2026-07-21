import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  DiagnosticItemStatus,
  DiagnosticSeverity,
  Prisma,
  ServiceOrderStatus,
} from "@prisma/client";
import { AuditService } from "../../audit/services/audit.service";
import { CreateServiceDiagnosticDto } from "../dto/create-service-diagnostic.dto";
import {
  DiagnosticItemDto,
  UpdateDiagnosticItemDto,
} from "../dto/diagnostic-item.dto";
import { UpdateServiceDiagnosticDto } from "../dto/update-service-diagnostic.dto";
import {
  ServiceDiagnosticItemResponse,
  ServiceDiagnosticResponse,
  ServiceDiagnosticsRepository,
} from "../repositories/service-diagnostics.repository";

const allowedCreationStatuses: ServiceOrderStatus[] = [
  ServiceOrderStatus.DIAGNOSIS,
  ServiceOrderStatus.WAITING_APPROVAL,
];
const lockedServiceOrderStatuses: ServiceOrderStatus[] = [
  ServiceOrderStatus.DELIVERED,
  ServiceOrderStatus.CANCELLED,
];

@Injectable()
export class ServiceDiagnosticsService {
  constructor(
    private readonly serviceDiagnosticsRepository: ServiceDiagnosticsRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(
    dto: CreateServiceDiagnosticDto,
    actorId?: string,
  ): Promise<ServiceDiagnosticResponse> {
    await this.ensureServiceOrderAllowsDiagnostic(dto.serviceOrderId);
    const activeDiagnostic =
      await this.serviceDiagnosticsRepository.findActiveByServiceOrderId(
        dto.serviceOrderId,
      );
    if (activeDiagnostic)
      throw new ConflictException(
        "La orden ya tiene un diagnóstico técnico activo",
      );

    this.validateItems(dto.items);
    const diagnostic = await this.serviceDiagnosticsRepository.create({
      serviceOrder: { connect: { id: dto.serviceOrderId } },
      generalObservation: normalizeOptional(dto.generalObservation),
      recommendation: normalizeOptional(dto.recommendation),
      createdBy: actorId ? { connect: { id: actorId } } : undefined,
      items: {
        create: dto.items.map((item) => this.toItemCreateData(item)),
      },
    });

    await this.audit("create", diagnostic, actorId, undefined, diagnostic);
    return diagnostic;
  }

  async findById(id: string): Promise<ServiceDiagnosticResponse> {
    const diagnostic = await this.serviceDiagnosticsRepository.findById(id);
    if (!diagnostic)
      throw new NotFoundException("Diagnóstico técnico no encontrado");
    return diagnostic;
  }

  async findByServiceOrderId(
    serviceOrderId: string,
  ): Promise<ServiceDiagnosticResponse | null> {
    const diagnostic =
      await this.serviceDiagnosticsRepository.findActiveByServiceOrderId(
        serviceOrderId,
      );
    return diagnostic;
  }

  async update(
    id: string,
    dto: UpdateServiceDiagnosticDto,
    actorId?: string,
  ): Promise<ServiceDiagnosticResponse> {
    const oldDiagnostic = await this.findById(id);
    this.ensureEditable(oldDiagnostic);

    const diagnostic = await this.serviceDiagnosticsRepository.update(id, {
      generalObservation: normalizeOptional(dto.generalObservation),
      recommendation: normalizeOptional(dto.recommendation),
      updatedBy: actorId ? { connect: { id: actorId } } : undefined,
    });

    await this.audit("update", diagnostic, actorId, oldDiagnostic, diagnostic);
    return diagnostic;
  }

  async addItem(
    id: string,
    dto: DiagnosticItemDto,
    actorId?: string,
  ): Promise<ServiceDiagnosticResponse> {
    const oldDiagnostic = await this.findById(id);
    this.ensureEditable(oldDiagnostic);
    this.validateItems([...oldDiagnostic.items, dto]);

    const diagnostic = await this.serviceDiagnosticsRepository.addItem(
      id,
      this.toItemCreateData(dto),
    );
    await this.audit(
      "create-item",
      diagnostic,
      actorId,
      oldDiagnostic,
      diagnostic,
    );
    return diagnostic;
  }

  async updateItem(
    id: string,
    itemId: string,
    dto: UpdateDiagnosticItemDto,
    actorId?: string,
  ): Promise<ServiceDiagnosticResponse> {
    const oldDiagnostic = await this.findById(id);
    this.ensureEditable(oldDiagnostic);
    const currentItem = await this.findItemOrFail(id, itemId);
    const mergedItem = { ...currentItem, ...dto };
    this.validateItems(
      oldDiagnostic.items.map((item) =>
        item.id === itemId ? mergedItem : item,
      ),
    );

    const diagnostic = await this.serviceDiagnosticsRepository.updateItem(
      id,
      itemId,
      this.toItemUpdateData(dto),
    );
    await this.audit(
      "update-item",
      diagnostic,
      actorId,
      oldDiagnostic,
      diagnostic,
    );
    return diagnostic;
  }

  async softDeleteItem(
    id: string,
    itemId: string,
    actorId?: string,
  ): Promise<ServiceDiagnosticResponse> {
    const oldDiagnostic = await this.findById(id);
    this.ensureEditable(oldDiagnostic);
    await this.findItemOrFail(id, itemId);

    const diagnostic = await this.serviceDiagnosticsRepository.softDeleteItem(
      id,
      itemId,
    );
    await this.audit(
      "delete-item",
      diagnostic,
      actorId,
      oldDiagnostic,
      diagnostic,
    );
    return diagnostic;
  }

  async complete(
    id: string,
    actorId?: string,
  ): Promise<ServiceDiagnosticResponse> {
    const oldDiagnostic = await this.findById(id);
    if (oldDiagnostic.completedAt)
      throw new BadRequestException("El diagnóstico ya fue completado");
    if (oldDiagnostic.items.length === 0)
      throw new BadRequestException(
        "Debe existir al menos un ítem antes de completar el diagnóstico",
      );

    const diagnostic = await this.serviceDiagnosticsRepository.update(id, {
      completedAt: new Date(),
      updatedBy: actorId ? { connect: { id: actorId } } : undefined,
    });

    await this.audit(
      "complete",
      diagnostic,
      actorId,
      oldDiagnostic,
      diagnostic,
    );
    return diagnostic;
  }

  async softDelete(
    id: string,
    actorId?: string,
  ): Promise<ServiceDiagnosticResponse> {
    const oldDiagnostic = await this.findById(id);
    const diagnostic = await this.serviceDiagnosticsRepository.update(id, {
      deletedAt: new Date(),
      updatedBy: actorId ? { connect: { id: actorId } } : undefined,
    });
    await this.audit("delete", diagnostic, actorId, oldDiagnostic, diagnostic);
    return diagnostic;
  }

  private async ensureServiceOrderAllowsDiagnostic(
    serviceOrderId: string,
  ): Promise<void> {
    const serviceOrder =
      await this.serviceDiagnosticsRepository.findActiveServiceOrderById(
        serviceOrderId,
      );
    if (!serviceOrder)
      throw new NotFoundException("Orden de servicio no encontrada");
    if (lockedServiceOrderStatuses.includes(serviceOrder.status)) {
      throw new BadRequestException(
        "No se puede diagnosticar una orden entregada o cancelada",
      );
    }
    if (!allowedCreationStatuses.includes(serviceOrder.status)) {
      throw new BadRequestException(
        "El diagnóstico solo puede crearse cuando la orden está en diagnóstico o esperando aprobación",
      );
    }
  }

  private ensureEditable(diagnostic: ServiceDiagnosticResponse): void {
    if (diagnostic.completedAt)
      throw new BadRequestException(
        "No se puede modificar un diagnóstico completado",
      );
  }

  private async findItemOrFail(
    id: string,
    itemId: string,
  ): Promise<ServiceDiagnosticItemResponse> {
    const item = await this.serviceDiagnosticsRepository.findItemById(
      id,
      itemId,
    );
    if (!item) throw new NotFoundException("Ítem de diagnóstico no encontrado");
    return item;
  }

  private validateItems(
    items: Array<DiagnosticItemDto | ServiceDiagnosticItemResponse>,
  ): void {
    if (items.length === 0)
      throw new BadRequestException(
        "Debe registrar al menos un ítem de diagnóstico",
      );

    const uniqueKeys = new Set<string>();
    for (const item of items) {
      const itemName = item.itemName.trim();
      const uniqueKey = `${item.category}:${itemName.toLocaleLowerCase()}`;
      if (uniqueKeys.has(uniqueKey))
        throw new BadRequestException(
          "No se permiten ítems duplicados dentro de la misma categoría",
        );
      uniqueKeys.add(uniqueKey);

      if (
        item.status === DiagnosticItemStatus.BAD &&
        !item.observation?.trim()
      ) {
        throw new BadRequestException(
          "La observación es obligatoria cuando el estado del ítem es malo",
        );
      }
      if (item.status === DiagnosticItemStatus.BAD && !item.severity) {
        throw new BadRequestException(
          "La severidad es obligatoria cuando el estado del ítem es malo",
        );
      }
    }
  }

  private toItemCreateData(
    item: DiagnosticItemDto,
  ): Prisma.ServiceDiagnosticItemCreateWithoutDiagnosticInput {
    return {
      category: item.category,
      itemName: item.itemName.trim(),
      status: item.status,
      observation: normalizeOptional(item.observation),
      severity:
        item.status === DiagnosticItemStatus.BAD
          ? item.severity
          : normalizeSeverity(item.severity),
    };
  }

  private toItemUpdateData(
    item: UpdateDiagnosticItemDto,
  ): Prisma.ServiceDiagnosticItemUpdateInput {
    return {
      category: item.category,
      itemName: item.itemName?.trim(),
      status: item.status,
      observation: normalizeOptional(item.observation),
      severity:
        item.status && item.status !== DiagnosticItemStatus.BAD
          ? normalizeSeverity(item.severity)
          : item.severity,
    };
  }

  private async audit(
    action: string,
    diagnostic: ServiceDiagnosticResponse,
    actorId?: string,
    oldValues?: ServiceDiagnosticResponse,
    newValues?: ServiceDiagnosticResponse,
  ): Promise<void> {
    await this.auditService.log({
      userId: actorId,
      action,
      module: "service-diagnostics",
      entity: "ServiceDiagnostic",
      entityId: diagnostic.id,
      oldValues,
      newValues,
    });
  }
}

function normalizeOptional(value?: string | null): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeSeverity(
  value?: DiagnosticSeverity | null,
): DiagnosticSeverity | undefined {
  return value ?? undefined;
}
