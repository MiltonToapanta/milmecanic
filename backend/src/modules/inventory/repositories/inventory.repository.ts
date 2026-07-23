import { Injectable } from '@nestjs/common';
import {
  Prisma,
  StockMovementType,
  StockReferenceType
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { InventoryProductQueryDto } from '../dto/inventory-product-query.dto';
import { StockMovementQueryDto } from '../dto/stock-movement-query.dto';

const inventoryCategorySelect = {
  id: true,
  name: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      products: {
        where: {
          deletedAt: null,
          isActive: true
        }
      }
    }
  }
} satisfies Prisma.InventoryCategorySelect;

const warehouseSelect = {
  id: true,
  code: true,
  name: true,
  description: true,
  location: true,
  isMain: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  stocks: {
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          deletedAt: true,
          isActive: true
        }
      }
    }
  }
} satisfies Prisma.WarehouseSelect;

const productSelect = {
  id: true,
  sku: true,
  barcode: true,
  name: true,
  description: true,
  categoryId: true,
  unit: true,
  costPrice: true,
  salePrice: true,
  minimumStock: true,
  maximumStock: true,
  isStockControlled: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true
    }
  },
  stocks: {
    include: {
      warehouse: {
        select: {
          id: true,
          code: true,
          name: true,
          isMain: true
        }
      }
    }
  }
} satisfies Prisma.InventoryProductSelect;

const movementSelect = {
  id: true,
  movementNumber: true,
  productId: true,
  warehouseId: true,
  movementType: true,
  quantity: true,
  unitCost: true,
  totalCost: true,
  previousStock: true,
  newStock: true,
  referenceType: true,
  referenceId: true,
  reason: true,
  notes: true,
  createdAt: true,
  product: {
    select: {
      id: true,
      sku: true,
      name: true
    }
  },
  warehouse: {
    select: {
      id: true,
      code: true,
      name: true
    }
  },
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true
    }
  }
} satisfies Prisma.StockMovementSelect;

type ProductRecord = Prisma.InventoryProductGetPayload<{ select: typeof productSelect }>;
type WarehouseRecord = Prisma.WarehouseGetPayload<{ select: typeof warehouseSelect }>;
type CategoryRecord = Prisma.InventoryCategoryGetPayload<{ select: typeof inventoryCategorySelect }>;
type MovementRecord = Prisma.StockMovementGetPayload<{ select: typeof movementSelect }>;

export interface StockCalculationInput {
  productId: string;
  warehouseId: string;
  movementType: StockMovementType;
  quantity: Prisma.Decimal;
  unitCost: Prisma.Decimal;
  referenceType: StockReferenceType;
  referenceId?: string;
  reason?: string;
  notes?: string;
  actorId?: string;
}

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findCategoryById(id: string) {
    const category = await this.prisma.inventoryCategory.findFirst({
      where: { id, deletedAt: null },
      select: inventoryCategorySelect
    });
    return category ? mapCategory(category) : null;
  }

  findActiveCategoryByName(name: string, excludeId?: string) {
    return this.prisma.inventoryCategory.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        isActive: true,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined
      }
    });
  }

  async findCategories(query: { search?: string; isActive?: boolean }) {
    const where: Prisma.InventoryCategoryWhereInput = {
      deletedAt: null,
      isActive: query.isActive,
      OR: query.search
        ? [
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } }
          ]
        : undefined
    };

    const categories = await this.prisma.inventoryCategory.findMany({
      where,
      select: inventoryCategorySelect,
      orderBy: { name: 'asc' }
    });

    return categories.map(mapCategory);
  }

  async createCategory(data: Prisma.InventoryCategoryCreateInput) {
    const category = await this.prisma.inventoryCategory.create({
      data,
      select: inventoryCategorySelect
    });
    return mapCategory(category);
  }

  async updateCategory(id: string, data: Prisma.InventoryCategoryUpdateInput) {
    const category = await this.prisma.inventoryCategory.update({
      where: { id },
      data,
      select: inventoryCategorySelect
    });
    return mapCategory(category);
  }

  countActiveProductsByCategory(categoryId: string) {
    return this.prisma.inventoryProduct.count({
      where: {
        categoryId,
        isActive: true,
        deletedAt: null
      }
    });
  }

  async softDeleteCategory(id: string, actorId?: string) {
    const category = await this.prisma.inventoryCategory.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedBy: actorId ? { connect: { id: actorId } } : undefined
      },
      select: inventoryCategorySelect
    });
    return mapCategory(category);
  }

  async findProductById(id: string) {
    const product = await this.findProductRecordById(id);
    return product ? mapProduct(product) : null;
  }

  findProductRecordById(id: string) {
    return this.prisma.inventoryProduct.findFirst({
      where: { id, deletedAt: null },
      select: productSelect
    });
  }

  findActiveProductBySku(sku: string, excludeId?: string) {
    return this.prisma.inventoryProduct.findFirst({
      where: {
        sku,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined
      },
      select: { id: true, sku: true }
    });
  }

  findActiveProductByBarcode(barcode: string, excludeId?: string) {
    return this.prisma.inventoryProduct.findFirst({
      where: {
        barcode,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined
      },
      select: { id: true, barcode: true }
    });
  }

  async findProducts(query: InventoryProductQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where = this.buildProductWhere(query);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryProduct.findMany({
        where,
        select: productSelect,
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.inventoryProduct.count({ where })
    ]);

    const mapped = items.map(mapProduct).filter((product) => {
      if (query.lowStock && !(product.availableStock <= product.minimumStock)) return false;
      if (query.outOfStock && product.availableStock !== 0) return false;
      return true;
    });

    return {
      items: mapped,
      pagination: {
        page,
        limit,
        total: query.lowStock || query.outOfStock ? mapped.length : total,
        totalPages: Math.ceil((query.lowStock || query.outOfStock ? mapped.length : total) / limit)
      }
    };
  }

  async createProduct(data: Prisma.InventoryProductCreateInput) {
    const product = await this.prisma.inventoryProduct.create({ data, select: productSelect });
    return mapProduct(product);
  }

  async updateProduct(id: string, data: Prisma.InventoryProductUpdateInput) {
    const product = await this.prisma.inventoryProduct.update({
      where: { id },
      data,
      select: productSelect
    });
    return mapProduct(product);
  }

  async softDeleteProduct(id: string, actorId?: string) {
    const product = await this.prisma.inventoryProduct.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedBy: actorId ? { connect: { id: actorId } } : undefined
      },
      select: productSelect
    });
    return mapProduct(product);
  }

  async findWarehouseById(id: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, deletedAt: null },
      select: warehouseSelect
    });
    return warehouse ? mapWarehouse(warehouse) : null;
  }

  findWarehouseByCode(code: string, excludeId?: string) {
    return this.prisma.warehouse.findFirst({
      where: {
        code,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined
      },
      select: { id: true, code: true }
    });
  }

  async findWarehouses(query: { search?: string; isActive?: boolean }) {
    const where: Prisma.WarehouseWhereInput = {
      deletedAt: null,
      isActive: query.isActive,
      OR: query.search
        ? [
            { code: { contains: query.search, mode: 'insensitive' } },
            { name: { contains: query.search, mode: 'insensitive' } },
            { location: { contains: query.search, mode: 'insensitive' } }
          ]
        : undefined
    };

    const warehouses = await this.prisma.warehouse.findMany({
      where,
      select: warehouseSelect,
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }]
    });

    return warehouses.map(mapWarehouse);
  }

  async createWarehouse(data: Prisma.WarehouseCreateInput) {
    const warehouse = await this.prisma.$transaction(async (tx) => {
      if (data.isMain === true) {
        await tx.warehouse.updateMany({
          where: { deletedAt: null, isActive: true, isMain: true },
          data: { isMain: false }
        });
      }
      return tx.warehouse.create({ data, select: warehouseSelect });
    });
    return mapWarehouse(warehouse);
  }

  async updateWarehouse(id: string, data: Prisma.WarehouseUpdateInput) {
    const warehouse = await this.prisma.$transaction(async (tx) => {
      if (data.isMain === true) {
        await tx.warehouse.updateMany({
          where: { id: { not: id }, deletedAt: null, isActive: true, isMain: true },
          data: { isMain: false }
        });
      }
      return tx.warehouse.update({ where: { id }, data, select: warehouseSelect });
    });
    return mapWarehouse(warehouse);
  }

  async softDeleteWarehouse(id: string, actorId?: string) {
    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        isMain: false,
        updatedBy: actorId ? { connect: { id: actorId } } : undefined
      },
      select: warehouseSelect
    });
    return mapWarehouse(warehouse);
  }

  async createMovement(data: StockCalculationInput) {
    const movement = await this.prisma.$transaction(async (tx) => {
      const counter = await tx.stockMovementCounter.upsert({
        where: { prefix: 'MOV' },
        update: { currentNumber: { increment: 1 } },
        create: { prefix: 'MOV', currentNumber: 1 }
      });

      const currentStock = await tx.warehouseStock.findUnique({
        where: {
          warehouseId_productId: {
            warehouseId: data.warehouseId,
            productId: data.productId
          }
        }
      });

      const previousStock = currentStock?.quantity ?? new Prisma.Decimal(0);
      const reservedQuantity = currentStock?.reservedQuantity ?? new Prisma.Decimal(0);
      const averageCost = currentStock?.averageCost ?? new Prisma.Decimal(0);
      const nextStock = isEntryMovement(data.movementType)
        ? previousStock.plus(data.quantity)
        : previousStock.minus(data.quantity);

      if (nextStock.lessThan(0)) {
        throw new Error('INSUFFICIENT_STOCK');
      }

      const availableQuantity = nextStock.minus(reservedQuantity);
      if (availableQuantity.lessThan(0)) {
        throw new Error('RESERVED_STOCK_EXCEEDED');
      }

      const nextAverageCost = isEntryMovement(data.movementType)
        ? calculateAverageCost({
            previousStock,
            averageCost,
            quantity: data.quantity,
            unitCost: data.unitCost
          })
        : averageCost;

      await tx.warehouseStock.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: data.warehouseId,
            productId: data.productId
          }
        },
        update: {
          quantity: nextStock,
          availableQuantity,
          averageCost: nextAverageCost
        },
        create: {
          warehouseId: data.warehouseId,
          productId: data.productId,
          quantity: nextStock,
          reservedQuantity: new Prisma.Decimal(0),
          availableQuantity: nextStock,
          averageCost: nextAverageCost
        }
      });

      return tx.stockMovement.create({
        data: {
          movementNumber: `MOV-${counter.currentNumber.toString().padStart(6, '0')}`,
          product: { connect: { id: data.productId } },
          warehouse: { connect: { id: data.warehouseId } },
          movementType: data.movementType,
          quantity: data.quantity,
          unitCost: data.unitCost,
          totalCost: data.quantity.times(data.unitCost).toDecimalPlaces(2),
          previousStock,
          newStock: nextStock,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          reason: data.reason,
          notes: data.notes,
          createdBy: data.actorId ? { connect: { id: data.actorId } } : undefined
        },
        select: movementSelect
      });
    });

    return mapMovement(movement);
  }

  async findKardex(productId: string, query: StockMovementQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.StockMovementWhereInput = {
      productId,
      warehouseId: query.warehouseId,
      movementType: query.movementType,
      createdAt: {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined
      }
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.stockMovement.findMany({
        where,
        select: movementSelect,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      this.prisma.stockMovement.count({ where })
    ]);

    return {
      items: items.map(mapMovement),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async findStock(query: InventoryProductQueryDto) {
    const productQuery = await this.findProducts(query);
    return {
      ...productQuery,
      items: productQuery.items.map((product) => ({
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          unit: product.unit,
          minimumStock: product.minimumStock
        },
        totalStock: product.totalStock,
        availableStock: product.availableStock,
        reservedStock: product.reservedStock,
        stockByWarehouse: product.stockByWarehouse
      }))
    };
  }

  async findStockByProduct(productId: string) {
    const product = await this.findProductById(productId);
    return product;
  }

  async findStockByWarehouse(warehouseId: string, query: InventoryProductQueryDto) {
    return this.findStock({ ...query, warehouseId });
  }

  private buildProductWhere(query: InventoryProductQueryDto): Prisma.InventoryProductWhereInput {
    return {
      deletedAt: null,
      categoryId: query.categoryId,
      isActive: query.isActive,
      isStockControlled: query.isStockControlled,
      stocks: query.warehouseId ? { some: { warehouseId: query.warehouseId } } : undefined,
      OR: query.search
        ? [
            { sku: { contains: query.search, mode: 'insensitive' } },
            { barcode: { contains: query.search, mode: 'insensitive' } },
            { name: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
            { category: { name: { contains: query.search, mode: 'insensitive' } } }
          ]
        : undefined
    };
  }
}

export function isEntryMovement(type: StockMovementType): boolean {
  const entryTypes: StockMovementType[] = [
    StockMovementType.INITIAL,
    StockMovementType.PURCHASE_ENTRY,
    StockMovementType.MANUAL_ENTRY,
    StockMovementType.TRANSFER_IN,
    StockMovementType.RETURN_ENTRY,
    StockMovementType.ADJUSTMENT_IN
  ];
  return entryTypes.includes(type);
}

export function isExitMovement(type: StockMovementType): boolean {
  return !isEntryMovement(type);
}

function calculateAverageCost(input: {
  previousStock: Prisma.Decimal;
  averageCost: Prisma.Decimal;
  quantity: Prisma.Decimal;
  unitCost: Prisma.Decimal;
}): Prisma.Decimal {
  const nextStock = input.previousStock.plus(input.quantity);
  if (nextStock.equals(0)) return input.unitCost.toDecimalPlaces(2);
  if (input.previousStock.equals(0)) return input.unitCost.toDecimalPlaces(2);

  return input.previousStock
    .times(input.averageCost)
    .plus(input.quantity.times(input.unitCost))
    .dividedBy(nextStock)
    .toDecimalPlaces(2);
}

function decimalToNumber(value: Prisma.Decimal): number {
  return Number(value.toFixed(2));
}

function mapCategory(category: CategoryRecord) {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
    activeProductsCount: category._count.products
  };
}

function mapWarehouse(warehouse: WarehouseRecord) {
  const activeStocks = warehouse.stocks.filter((stock) => stock.product.deletedAt === null);
  const stockTotal = activeStocks.reduce((sum, stock) => sum + decimalToNumber(stock.quantity), 0);
  const inventoryValue = activeStocks.reduce(
    (sum, stock) => sum + decimalToNumber(stock.quantity.times(stock.averageCost)),
    0
  );

  return {
    id: warehouse.id,
    code: warehouse.code,
    name: warehouse.name,
    description: warehouse.description,
    location: warehouse.location,
    isMain: warehouse.isMain,
    isActive: warehouse.isActive,
    createdAt: warehouse.createdAt,
    updatedAt: warehouse.updatedAt,
    productsCount: new Set(activeStocks.map((stock) => stock.productId)).size,
    stockTotal,
    inventoryValue: Number(inventoryValue.toFixed(2))
  };
}

function mapProduct(product: ProductRecord) {
  const stockByWarehouse = product.stocks.map((stock) => ({
    warehouse: {
      id: stock.warehouse.id,
      code: stock.warehouse.code,
      name: stock.warehouse.name,
      isMain: stock.warehouse.isMain
    },
    quantity: decimalToNumber(stock.quantity),
    reservedQuantity: decimalToNumber(stock.reservedQuantity),
    availableQuantity: decimalToNumber(stock.availableQuantity),
    averageCost: decimalToNumber(stock.averageCost)
  }));

  return {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    description: product.description,
    categoryId: product.categoryId,
    category: product.category,
    unit: product.unit,
    costPrice: decimalToNumber(product.costPrice),
    salePrice: decimalToNumber(product.salePrice),
    minimumStock: decimalToNumber(product.minimumStock),
    maximumStock: product.maximumStock ? decimalToNumber(product.maximumStock) : null,
    isStockControlled: product.isStockControlled,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    totalStock: stockByWarehouse.reduce((sum, stock) => sum + stock.quantity, 0),
    availableStock: stockByWarehouse.reduce((sum, stock) => sum + stock.availableQuantity, 0),
    reservedStock: stockByWarehouse.reduce((sum, stock) => sum + stock.reservedQuantity, 0),
    stockByWarehouse
  };
}

function mapMovement(movement: MovementRecord) {
  const entryQuantity = isEntryMovement(movement.movementType) ? decimalToNumber(movement.quantity) : 0;
  const exitQuantity = isExitMovement(movement.movementType) ? decimalToNumber(movement.quantity) : 0;

  return {
    id: movement.id,
    movementNumber: movement.movementNumber,
    product: movement.product,
    warehouse: movement.warehouse,
    movementType: movement.movementType,
    entryQuantity,
    exitQuantity,
    quantity: decimalToNumber(movement.quantity),
    unitCost: decimalToNumber(movement.unitCost),
    totalCost: decimalToNumber(movement.totalCost),
    previousStock: decimalToNumber(movement.previousStock),
    newStock: decimalToNumber(movement.newStock),
    referenceType: movement.referenceType,
    referenceId: movement.referenceId,
    reason: movement.reason,
    notes: movement.notes,
    createdAt: movement.createdAt,
    user: movement.createdBy
      ? {
          id: movement.createdBy.id,
          displayName: `${movement.createdBy.firstName} ${movement.createdBy.lastName}`
        }
      : null
  };
}
