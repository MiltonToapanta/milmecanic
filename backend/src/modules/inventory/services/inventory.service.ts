import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma, StockMovementType, StockReferenceType } from '@prisma/client';
import { AuditService } from '../../audit/services/audit.service';
import { CreateInventoryCategoryDto } from '../dto/create-inventory-category.dto';
import { CreateInventoryProductDto } from '../dto/create-inventory-product.dto';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { InventoryProductQueryDto } from '../dto/inventory-product-query.dto';
import { StockMovementQueryDto } from '../dto/stock-movement-query.dto';
import { UpdateInventoryCategoryDto } from '../dto/update-inventory-category.dto';
import { UpdateInventoryProductDto } from '../dto/update-inventory-product.dto';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';
import {
  InventoryRepository,
  isEntryMovement,
  isExitMovement
} from '../repositories/inventory.repository';

const MOVEMENTS_REQUIRING_REASON: StockMovementType[] = [
  StockMovementType.MANUAL_ENTRY,
  StockMovementType.ADJUSTMENT_IN,
  StockMovementType.ADJUSTMENT_OUT,
  StockMovementType.DAMAGED_EXIT
];

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository: InventoryRepository,
    private readonly auditService: AuditService
  ) {}

  async createCategory(dto: CreateInventoryCategoryDto, actorId?: string) {
    const name = normalizeText(dto.name);
    await this.ensureCategoryNameAvailable(name);

    const category = await this.inventoryRepository.createCategory({
      name,
      description: dto.description?.trim(),
      isActive: dto.isActive ?? true,
      createdBy: actorId ? { connect: { id: actorId } } : undefined,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });

    await this.audit('create', 'InventoryCategory', category.id, undefined, category, actorId);
    return category;
  }

  findCategories(query: { search?: string; isActive?: boolean }) {
    return this.inventoryRepository.findCategories(query);
  }

  async findCategoryById(id: string) {
    const category = await this.inventoryRepository.findCategoryById(id);
    if (!category) throw new NotFoundException('Categoría de inventario no encontrada');
    return category;
  }

  async updateCategory(id: string, dto: UpdateInventoryCategoryDto, actorId?: string) {
    const existing = await this.findCategoryById(id);
    const name = dto.name !== undefined ? normalizeText(dto.name) : undefined;
    if (name) await this.ensureCategoryNameAvailable(name, id);

    const updated = await this.inventoryRepository.updateCategory(id, {
      name,
      description: dto.description !== undefined ? dto.description?.trim() : undefined,
      isActive: dto.isActive,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });

    await this.audit('update', 'InventoryCategory', id, existing, updated, actorId);
    return updated;
  }

  async deleteCategory(id: string, actorId?: string) {
    const existing = await this.findCategoryById(id);
    const activeProducts = await this.inventoryRepository.countActiveProductsByCategory(id);
    if (activeProducts > 0) {
      throw new BadRequestException('No se puede eliminar una categoría con productos activos');
    }

    const deleted = await this.inventoryRepository.softDeleteCategory(id, actorId);
    await this.audit('soft-delete', 'InventoryCategory', id, existing, deleted, actorId);
    return deleted;
  }

  async createProduct(dto: CreateInventoryProductDto, actorId?: string) {
    const category = await this.inventoryRepository.findCategoryById(dto.categoryId);
    if (!category || !category.isActive) {
      throw new BadRequestException('La categoría seleccionada no está activa');
    }

    this.validateStockLimits(dto.minimumStock, dto.maximumStock);
    const sku = normalizeCode(dto.sku);
    const barcode = dto.barcode ? normalizeCode(dto.barcode) : undefined;
    await this.ensureSkuAvailable(sku);
    if (barcode) await this.ensureBarcodeAvailable(barcode);

    const product = await this.inventoryRepository.createProduct({
      sku,
      barcode,
      name: normalizeText(dto.name),
      description: dto.description?.trim(),
      category: { connect: { id: dto.categoryId } },
      unit: dto.unit,
      costPrice: toDecimal(dto.costPrice),
      salePrice: toDecimal(dto.salePrice),
      minimumStock: toDecimal(dto.minimumStock),
      maximumStock: dto.maximumStock !== undefined ? toDecimal(dto.maximumStock) : undefined,
      isStockControlled: dto.isStockControlled ?? true,
      isActive: dto.isActive ?? true,
      createdBy: actorId ? { connect: { id: actorId } } : undefined,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });

    await this.audit('create', 'InventoryProduct', product.id, undefined, product, actorId);
    return product;
  }

  findProducts(query: InventoryProductQueryDto) {
    return this.inventoryRepository.findProducts(query);
  }

  async findProductById(id: string) {
    const product = await this.inventoryRepository.findProductById(id);
    if (!product) throw new NotFoundException('Producto de inventario no encontrado');
    return product;
  }

  async updateProduct(id: string, dto: UpdateInventoryProductDto, actorId?: string) {
    const existing = await this.findProductById(id);

    if (dto.categoryId) {
      const category = await this.inventoryRepository.findCategoryById(dto.categoryId);
      if (!category || !category.isActive) {
        throw new BadRequestException('La categoría seleccionada no está activa');
      }
    }

    const minimumStock = dto.minimumStock ?? existing.minimumStock;
    const maximumStock = dto.maximumStock ?? existing.maximumStock ?? undefined;
    this.validateStockLimits(minimumStock, maximumStock);

    const sku = dto.sku !== undefined ? normalizeCode(dto.sku) : undefined;
    const barcode = dto.barcode !== undefined && dto.barcode !== '' ? normalizeCode(dto.barcode) : undefined;
    if (sku) await this.ensureSkuAvailable(sku, id);
    if (barcode) await this.ensureBarcodeAvailable(barcode, id);

    const updated = await this.inventoryRepository.updateProduct(id, {
      sku,
      barcode: dto.barcode === '' ? null : barcode,
      name: dto.name !== undefined ? normalizeText(dto.name) : undefined,
      description: dto.description !== undefined ? dto.description?.trim() : undefined,
      category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
      unit: dto.unit,
      costPrice: dto.costPrice !== undefined ? toDecimal(dto.costPrice) : undefined,
      salePrice: dto.salePrice !== undefined ? toDecimal(dto.salePrice) : undefined,
      minimumStock: dto.minimumStock !== undefined ? toDecimal(dto.minimumStock) : undefined,
      maximumStock: dto.maximumStock !== undefined ? toDecimal(dto.maximumStock) : undefined,
      isStockControlled: dto.isStockControlled,
      isActive: dto.isActive,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });

    await this.audit('update', 'InventoryProduct', id, existing, updated, actorId);
    return updated;
  }

  async deleteProduct(id: string, actorId?: string) {
    const existing = await this.findProductById(id);
    const deleted = await this.inventoryRepository.softDeleteProduct(id, actorId);
    await this.audit('soft-delete', 'InventoryProduct', id, existing, deleted, actorId);
    return deleted;
  }

  async createWarehouse(dto: CreateWarehouseDto, actorId?: string) {
    const code = normalizeCode(dto.code);
    await this.ensureWarehouseCodeAvailable(code);

    const warehouse = await this.inventoryRepository.createWarehouse({
      code,
      name: normalizeText(dto.name),
      description: dto.description?.trim(),
      location: dto.location?.trim(),
      isMain: dto.isMain ?? false,
      isActive: dto.isActive ?? true,
      createdBy: actorId ? { connect: { id: actorId } } : undefined,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });

    await this.audit(dto.isMain ? 'create-main-warehouse' : 'create', 'Warehouse', warehouse.id, undefined, warehouse, actorId);
    return warehouse;
  }

  findWarehouses(query: { search?: string; isActive?: boolean }) {
    return this.inventoryRepository.findWarehouses(query);
  }

  async findWarehouseById(id: string) {
    const warehouse = await this.inventoryRepository.findWarehouseById(id);
    if (!warehouse) throw new NotFoundException('Bodega no encontrada');
    return warehouse;
  }

  async updateWarehouse(id: string, dto: UpdateWarehouseDto, actorId?: string) {
    const existing = await this.findWarehouseById(id);
    const code = dto.code !== undefined ? normalizeCode(dto.code) : undefined;
    if (code) await this.ensureWarehouseCodeAvailable(code, id);

    const updated = await this.inventoryRepository.updateWarehouse(id, {
      code,
      name: dto.name !== undefined ? normalizeText(dto.name) : undefined,
      description: dto.description !== undefined ? dto.description?.trim() : undefined,
      location: dto.location !== undefined ? dto.location?.trim() : undefined,
      isMain: dto.isMain,
      isActive: dto.isActive,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });

    await this.audit(dto.isMain ? 'set-main-warehouse' : 'update', 'Warehouse', id, existing, updated, actorId);
    return updated;
  }

  async deleteWarehouse(id: string, actorId?: string) {
    const existing = await this.findWarehouseById(id);
    if (existing.stockTotal > 0) {
      throw new BadRequestException('No se puede eliminar una bodega con stock disponible');
    }

    const deleted = await this.inventoryRepository.softDeleteWarehouse(id, actorId);
    await this.audit('soft-delete', 'Warehouse', id, existing, deleted, actorId);
    return deleted;
  }

  async createMovement(dto: CreateStockMovementDto, actorId?: string) {
    const product = await this.inventoryRepository.findProductRecordById(dto.productId);
    if (!product || !product.isActive) throw new BadRequestException('El producto seleccionado no está activo');

    const warehouse = await this.inventoryRepository.findWarehouseById(dto.warehouseId);
    if (!warehouse || !warehouse.isActive) throw new BadRequestException('La bodega seleccionada no está activa');

    if (MOVEMENTS_REQUIRING_REASON.includes(dto.movementType) && !dto.reason?.trim()) {
      throw new BadRequestException('El motivo es obligatorio para este tipo de movimiento');
    }

    if (isEntryMovement(dto.movementType) && dto.unitCost === undefined) {
      throw new BadRequestException('El costo unitario es obligatorio para movimientos de entrada');
    }

    const unitCost = dto.unitCost !== undefined ? toDecimal(dto.unitCost) : this.findAverageCost(product, dto.warehouseId);

    try {
      const movement = await this.inventoryRepository.createMovement({
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        movementType: dto.movementType,
        quantity: toDecimal(dto.quantity),
        unitCost,
        referenceType: dto.referenceType ?? defaultReferenceType(dto.movementType),
        referenceId: dto.referenceId,
        reason: dto.reason?.trim(),
        notes: dto.notes?.trim(),
        actorId
      });

      await this.audit('create-movement', 'StockMovement', movement.id, undefined, movement, actorId);
      return movement;
    } catch (error) {
      if (error instanceof Error && error.message === 'INSUFFICIENT_STOCK') {
        throw new BadRequestException('La salida no puede dejar stock negativo');
      }
      if (error instanceof Error && error.message === 'RESERVED_STOCK_EXCEEDED') {
        throw new BadRequestException('No se puede usar stock reservado como disponible');
      }
      throw error;
    }
  }

  async findKardex(productId: string, query: StockMovementQueryDto) {
    await this.findProductById(productId);
    return this.inventoryRepository.findKardex(productId, query);
  }

  findStock(query: InventoryProductQueryDto) {
    return this.inventoryRepository.findStock(query);
  }

  async findStockByProduct(productId: string) {
    const stock = await this.inventoryRepository.findStockByProduct(productId);
    if (!stock) throw new NotFoundException('Producto de inventario no encontrado');
    return stock;
  }

  async findStockByWarehouse(warehouseId: string, query: InventoryProductQueryDto) {
    await this.findWarehouseById(warehouseId);
    return this.inventoryRepository.findStockByWarehouse(warehouseId, query);
  }

  private async ensureCategoryNameAvailable(name: string, excludeId?: string) {
    const existing = await this.inventoryRepository.findActiveCategoryByName(name, excludeId);
    if (existing) throw new ConflictException('Ya existe una categoría activa con ese nombre');
  }

  private async ensureSkuAvailable(sku: string, excludeId?: string) {
    const existing = await this.inventoryRepository.findActiveProductBySku(sku, excludeId);
    if (existing) throw new ConflictException('Ya existe un producto con ese SKU');
  }

  private async ensureBarcodeAvailable(barcode: string, excludeId?: string) {
    const existing = await this.inventoryRepository.findActiveProductByBarcode(barcode, excludeId);
    if (existing) throw new ConflictException('Ya existe un producto con ese código de barras');
  }

  private async ensureWarehouseCodeAvailable(code: string, excludeId?: string) {
    const existing = await this.inventoryRepository.findWarehouseByCode(code, excludeId);
    if (existing) throw new ConflictException('Ya existe una bodega con ese código');
  }

  private validateStockLimits(minimumStock: number, maximumStock?: number) {
    if (maximumStock !== undefined && maximumStock < minimumStock) {
      throw new BadRequestException('El stock máximo no puede ser menor que el stock mínimo');
    }
  }

  private findAverageCost(product: Awaited<ReturnType<InventoryRepository['findProductRecordById']>>, warehouseId: string) {
    const stock = product?.stocks.find((item) => item.warehouseId === warehouseId);
    return stock?.averageCost ?? new Prisma.Decimal(0);
  }

  private audit(
    action: string,
    entity: string,
    entityId: string,
    oldValues?: unknown,
    newValues?: unknown,
    actorId?: string
  ) {
    return this.auditService.log({
      userId: actorId,
      action,
      module: 'inventory',
      entity,
      entityId,
      oldValues,
      newValues
    });
  }
}

function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

function normalizeText(value: string): string {
  return value.trim();
}

function toDecimal(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value).toDecimalPlaces(2);
}

function defaultReferenceType(type: StockMovementType): StockReferenceType {
  if (type === StockMovementType.PURCHASE_ENTRY) return StockReferenceType.PURCHASE;
  if (type === StockMovementType.SERVICE_ORDER_EXIT) return StockReferenceType.SERVICE_ORDER;
  if (
    type === StockMovementType.ADJUSTMENT_IN ||
    type === StockMovementType.ADJUSTMENT_OUT
  ) {
    return StockReferenceType.ADJUSTMENT;
  }
  if (type === StockMovementType.RETURN_ENTRY) return StockReferenceType.RETURN;
  if (type === StockMovementType.TRANSFER_IN || type === StockMovementType.TRANSFER_OUT) {
    return StockReferenceType.TRANSFER;
  }
  if (isExitMovement(type)) return StockReferenceType.MANUAL;
  return StockReferenceType.MANUAL;
}
