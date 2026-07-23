import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma, QuotationStatus, ServiceOrderStatus } from '@prisma/client';
import { AuditService } from '../../audit/services/audit.service';
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import { CreateQuotationItemDto } from '../dto/quotation-item.dto';
import { QuotationQueryDto } from '../dto/quotation-query.dto';
import { UpdateQuotationDto } from '../dto/update-quotation.dto';
import { QuotationsRepository } from '../repositories/quotations.repository';

const FORBIDDEN_ORDER_STATUSES: ServiceOrderStatus[] = [
  ServiceOrderStatus.DELIVERED,
  ServiceOrderStatus.CANCELLED
];

const allowedTransitions: Record<QuotationStatus, QuotationStatus[]> = {
  [QuotationStatus.DRAFT]: [QuotationStatus.SENT, QuotationStatus.CANCELLED],
  [QuotationStatus.SENT]: [QuotationStatus.APPROVED, QuotationStatus.REJECTED, QuotationStatus.CANCELLED],
  [QuotationStatus.APPROVED]: [],
  [QuotationStatus.REJECTED]: [],
  [QuotationStatus.EXPIRED]: [],
  [QuotationStatus.CANCELLED]: []
};

function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value);
}

function roundTwo(value: Prisma.Decimal): Prisma.Decimal {
  return value.toDecimalPlaces(2);
}

function calculateItemValues(item: {
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}): {
  base: Prisma.Decimal;
  subtotal: Prisma.Decimal;
  tax: Prisma.Decimal;
  total: Prisma.Decimal;
} {
  const base = roundTwo(toDecimal(item.quantity).times(toDecimal(item.unitPrice)));
  const discount = toDecimal(item.discount);
  if (discount.greaterThan(base)) {
    throw new BadRequestException('El descuento del ítem no puede superar el valor base');
  }
  const subtotal = roundTwo(base.minus(discount));
  const tax = roundTwo(subtotal.times(toDecimal(item.taxRate)).dividedBy(100));
  const total = roundTwo(subtotal.plus(tax));
  return { base, subtotal, tax, total };
}

function calculateTotals(
  items: Array<{
    quantity: number;
    unitPrice: number;
    discount: number;
    taxRate: number;
  }>,
  generalDiscount: number
): {
  subtotal: Prisma.Decimal;
  discount: Prisma.Decimal;
  tax: Prisma.Decimal;
  total: Prisma.Decimal;
} {
  let subtotal = new Prisma.Decimal(0);
  let tax = new Prisma.Decimal(0);

  for (const item of items) {
    const values = calculateItemValues(item);
    subtotal = subtotal.plus(values.subtotal);
    tax = tax.plus(values.tax);
  }

  subtotal = roundTwo(subtotal);
  const discount = toDecimal(generalDiscount);

  if (discount.greaterThan(subtotal)) {
    throw new BadRequestException('El descuento general no puede superar el subtotal');
  }

  const total = roundTwo(subtotal.minus(discount).plus(tax));
  return { subtotal, discount, tax, total };
}

@Injectable()
export class QuotationsService {
  constructor(
    private readonly quotationsRepository: QuotationsRepository,
    private readonly auditService: AuditService
  ) {}

  findAll(query: QuotationQueryDto) {
    return this.quotationsRepository.findAll(query);
  }

  async findByServiceOrderId(serviceOrderId: string, query: QuotationQueryDto) {
    return this.quotationsRepository.findByServiceOrderId(serviceOrderId, query);
  }

  async findById(id: string) {
    const quotation = await this.quotationsRepository.findById(id);
    if (!quotation) throw new NotFoundException('Cotización no encontrada');
    return quotation;
  }

  async create(dto: CreateQuotationDto, actorId?: string) {
    const serviceOrder = await this.quotationsRepository.findServiceOrderById(dto.serviceOrderId);
    if (!serviceOrder) throw new NotFoundException('Orden de servicio no encontrada');

    if (FORBIDDEN_ORDER_STATUSES.includes(serviceOrder.status)) {
      throw new BadRequestException(
        'No se puede crear cotización para una orden entregada o cancelada'
      );
    }

    const activeQuotation = await this.quotationsRepository.findActiveByServiceOrderId(
      dto.serviceOrderId,
      [QuotationStatus.DRAFT, QuotationStatus.SENT]
    );
    if (activeQuotation) {
      throw new ConflictException(
        'Ya existe una cotización activa (borrador o enviada) para esta orden'
      );
    }

    const totals = calculateTotals(
      dto.items.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount ?? 0,
        taxRate: i.taxRate ?? 0
      })),
      dto.discount ?? 0
    );

    const prefix = await this.quotationsRepository.getQuotationPrefix();

    const quotation = await this.quotationsRepository.createTransactional({
      prefix,
      quotationData: {
        serviceOrder: { connect: { id: dto.serviceOrderId } },
        status: QuotationStatus.DRAFT,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
        notes: dto.notes,
        createdBy: actorId ? { connect: { id: actorId } } : undefined
      },
      itemsData: dto.items.map((item) => {
        const values = calculateItemValues({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount ?? 0,
          taxRate: item.taxRate ?? 0
        });
        return {
          itemType: item.itemType,
          description: item.description,
          quantity: toDecimal(item.quantity),
          unitPrice: toDecimal(item.unitPrice),
          discount: toDecimal(item.discount ?? 0),
          taxRate: toDecimal(item.taxRate ?? 0),
          subtotal: values.subtotal,
          tax: values.tax,
          total: values.total
        };
      })
    });

    await this.auditService.log({
      userId: actorId,
      action: 'create',
      module: 'quotations',
      entity: 'Quotation',
      entityId: quotation.id,
      newValues: quotation
    });

    return quotation;
  }

  async update(id: string, dto: UpdateQuotationDto, actorId?: string) {
    const existing = await this.findById(id);
    if (existing.status !== QuotationStatus.DRAFT) {
      throw new BadRequestException('Solo se puede editar una cotización en estado borrador');
    }

    let totals: ReturnType<typeof calculateTotals> | undefined;

    if (dto.items && dto.items.length > 0) {
      const mergedItems = dto.items.map((item, index) => {
        const current = existing.items[index];
        return {
          quantity: item.quantity ?? current?.quantity ?? 1,
          unitPrice: item.unitPrice ?? current?.unitPrice ?? 0,
          discount: item.discount ?? current?.discount ?? 0,
          taxRate: item.taxRate ?? current?.taxRate ?? 0
        };
      });

      totals = calculateTotals(mergedItems, dto.discount ?? existing.discount);
    } else if (dto.discount !== undefined) {
      const mergedItems = existing.items.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        taxRate: i.taxRate
      }));
      totals = calculateTotals(mergedItems, dto.discount);
    }

    const updateData: Prisma.QuotationUpdateInput = {
      validUntil: dto.validUntil !== undefined ? (dto.validUntil ? new Date(dto.validUntil) : null) : undefined,
      notes: dto.notes,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    };

    if (totals) {
      updateData.subtotal = totals.subtotal;
      updateData.discount = totals.discount;
      updateData.tax = totals.tax;
      updateData.total = totals.total;
    }

    await this.quotationsRepository.update(id, updateData);

    if (dto.items && dto.items.length > 0) {
      for (let i = 0; i < dto.items.length; i++) {
        const itemDto = dto.items[i];
        const currentItem = existing.items[i];
        if (currentItem && itemDto) {
          const values = calculateItemValues({
            quantity: itemDto.quantity ?? currentItem.quantity,
            unitPrice: itemDto.unitPrice ?? currentItem.unitPrice,
            discount: itemDto.discount ?? currentItem.discount,
            taxRate: itemDto.taxRate ?? currentItem.taxRate
          });
          await this.quotationsRepository.updateItem(currentItem.id, {
            itemType: itemDto.itemType,
            description: itemDto.description,
            quantity: itemDto.quantity !== undefined ? toDecimal(itemDto.quantity) : undefined,
            unitPrice: itemDto.unitPrice !== undefined ? toDecimal(itemDto.unitPrice) : undefined,
            discount: itemDto.discount !== undefined ? toDecimal(itemDto.discount) : undefined,
            taxRate: itemDto.taxRate !== undefined ? toDecimal(itemDto.taxRate) : undefined,
            subtotal: values.subtotal,
            tax: values.tax,
            total: values.total
          });
        }
      }
    }

    const updated = await this.findById(id);

    await this.auditService.log({
      userId: actorId,
      action: 'update',
      module: 'quotations',
      entity: 'Quotation',
      entityId: id,
      oldValues: existing,
      newValues: updated
    });

    return updated;
  }

  async addItem(id: string, dto: CreateQuotationItemDto, actorId?: string) {
    const existing = await this.findById(id);
    if (existing.status !== QuotationStatus.DRAFT) {
      throw new BadRequestException('Solo se puede agregar ítems en estado borrador');
    }

    const values = calculateItemValues({
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      discount: dto.discount ?? 0,
      taxRate: dto.taxRate ?? 0
    });

    await this.quotationsRepository.addItem(id, {
      itemType: dto.itemType,
      description: dto.description,
      quantity: toDecimal(dto.quantity),
      unitPrice: toDecimal(dto.unitPrice),
      discount: toDecimal(dto.discount ?? 0),
      taxRate: toDecimal(dto.taxRate ?? 0),
      subtotal: values.subtotal,
      tax: values.tax,
      total: values.total
    });

    await this.recalculateTotals(id);

    const updated = await this.findById(id);

    await this.auditService.log({
      userId: actorId,
      action: 'add-item',
      module: 'quotations',
      entity: 'Quotation',
      entityId: id,
      oldValues: existing,
      newValues: updated
    });

    return updated;
  }

  async updateItem(id: string, itemId: string, dto: CreateQuotationItemDto, actorId?: string) {
    const existing = await this.findById(id);
    if (existing.status !== QuotationStatus.DRAFT) {
      throw new BadRequestException('Solo se puede modificar ítems en estado borrador');
    }

    const existingItem = existing.items.find((i) => i.id === itemId);
    if (!existingItem) {
      throw new NotFoundException('Ítem de cotización no encontrado');
    }

    const values = calculateItemValues({
      quantity: dto.quantity,
      unitPrice: dto.unitPrice,
      discount: dto.discount ?? 0,
      taxRate: dto.taxRate ?? 0
    });

    await this.quotationsRepository.updateItem(itemId, {
      itemType: dto.itemType,
      description: dto.description,
      quantity: toDecimal(dto.quantity),
      unitPrice: toDecimal(dto.unitPrice),
      discount: toDecimal(dto.discount ?? 0),
      taxRate: toDecimal(dto.taxRate ?? 0),
      subtotal: values.subtotal,
      tax: values.tax,
      total: values.total
    });

    await this.recalculateTotals(id);

    const updated = await this.findById(id);

    await this.auditService.log({
      userId: actorId,
      action: 'update-item',
      module: 'quotations',
      entity: 'QuotationItem',
      entityId: itemId,
      oldValues: existingItem,
      newValues: updated.items.find((i) => i.id === itemId)
    });

    return updated;
  }

  async removeItem(id: string, itemId: string, actorId?: string) {
    const existing = await this.findById(id);
    if (existing.status !== QuotationStatus.DRAFT) {
      throw new BadRequestException('Solo se puede eliminar ítems en estado borrador');
    }

    const existingItem = existing.items.find((i) => i.id === itemId);
    if (!existingItem) {
      throw new NotFoundException('Ítem de cotización no encontrado');
    }

    await this.quotationsRepository.softDeleteItem(itemId);
    await this.recalculateTotals(id);

    const updated = await this.findById(id);

    await this.auditService.log({
      userId: actorId,
      action: 'delete-item',
      module: 'quotations',
      entity: 'QuotationItem',
      entityId: itemId,
      oldValues: existingItem
    });

    return updated;
  }

  async send(id: string, actorId?: string) {
    return this.changeStatus(id, QuotationStatus.SENT, actorId, 'send');
  }

  async approve(id: string, actorId?: string) {
    const existing = await this.findById(id);
    if (existing.validUntil && new Date(existing.validUntil) < new Date()) {
      throw new BadRequestException('No se puede aprobar una cotización vencida');
    }
    return this.changeStatus(id, QuotationStatus.APPROVED, actorId, 'approve', {
      approvedAt: new Date()
    });
  }

  async reject(id: string, rejectionReason: string | undefined, actorId?: string) {
    if (!rejectionReason || rejectionReason.trim().length === 0) {
      throw new BadRequestException('El motivo de rechazo es obligatorio');
    }
    return this.changeStatus(id, QuotationStatus.REJECTED, actorId, 'reject', {
      rejectedAt: new Date(),
      rejectionReason
    });
  }

  async cancel(id: string, actorId?: string) {
    return this.changeStatus(id, QuotationStatus.CANCELLED, actorId, 'cancel');
  }

  async softDelete(id: string, actorId?: string) {
    const existing = await this.findById(id);
    if (existing.status !== QuotationStatus.DRAFT) {
      throw new BadRequestException('Solo se puede eliminar una cotización en estado borrador');
    }

    await this.quotationsRepository.softDelete(id);

    await this.auditService.log({
      userId: actorId,
      action: 'delete',
      module: 'quotations',
      entity: 'Quotation',
      entityId: id,
      oldValues: existing
    });
  }

  private async changeStatus(
    id: string,
    newStatus: QuotationStatus,
    actorId: string | undefined,
    action: string,
    extraData?: Partial<Prisma.QuotationUpdateInput>
  ) {
    const existing = await this.findById(id);
    const allowed = allowedTransitions[existing.status];

    if (!allowed.includes(newStatus)) {
      throw new ForbiddenException(
        `No se puede cambiar de ${existing.status} a ${newStatus}`
      );
    }

    const quotation = await this.quotationsRepository.update(id, {
      status: newStatus,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined,
      ...extraData
    });

    await this.auditService.log({
      userId: actorId,
      action,
      module: 'quotations',
      entity: 'Quotation',
      entityId: id,
      oldValues: existing,
      newValues: quotation
    });

    return quotation;
  }

  private async recalculateTotals(id: string): Promise<void> {
    const quotation = await this.findById(id);
    const activeItems = quotation.items;

    const totals = calculateTotals(
      activeItems.map((i) => ({
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        discount: i.discount,
        taxRate: i.taxRate
      })),
      quotation.discount
    );

    await this.quotationsRepository.update(id, {
      subtotal: totals.subtotal,
      discount: totals.discount,
      tax: totals.tax,
      total: totals.total
    });
  }
}
