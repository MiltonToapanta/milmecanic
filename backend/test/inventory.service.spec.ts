import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { InventoryUnit, Prisma, StockMovementType } from '@prisma/client';
import { InventoryService } from '../src/modules/inventory/services/inventory.service';

const category = {
  id: 'category-id',
  name: 'Filtros',
  description: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  activeProductsCount: 0
};

const warehouse = {
  id: 'warehouse-id',
  code: 'MAIN',
  name: 'Bodega principal',
  description: null,
  location: null,
  isMain: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  productsCount: 1,
  stockTotal: 10,
  inventoryValue: 120
};

const product = {
  id: 'product-id',
  sku: 'FIL-001',
  barcode: '123456',
  name: 'Filtro de aceite',
  description: null,
  categoryId: 'category-id',
  unit: InventoryUnit.UNIT,
  costPrice: new Prisma.Decimal(10),
  salePrice: new Prisma.Decimal(15),
  minimumStock: new Prisma.Decimal(2),
  maximumStock: new Prisma.Decimal(20),
  isStockControlled: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: { id: 'category-id', name: 'Filtros' },
  stocks: [
    {
      id: 'stock-id',
      warehouseId: 'warehouse-id',
      productId: 'product-id',
      quantity: new Prisma.Decimal(10),
      reservedQuantity: new Prisma.Decimal(0),
      availableQuantity: new Prisma.Decimal(10),
      averageCost: new Prisma.Decimal(12),
      updatedAt: new Date(),
      warehouse: { id: 'warehouse-id', code: 'MAIN', name: 'Bodega principal', isMain: true }
    }
  ]
};

describe('InventoryService', () => {
  const repository = {
    findActiveCategoryByName: jest.fn(),
    createCategory: jest.fn(),
    findCategories: jest.fn(),
    findCategoryById: jest.fn(),
    updateCategory: jest.fn(),
    countActiveProductsByCategory: jest.fn(),
    softDeleteCategory: jest.fn(),
    findProductById: jest.fn(),
    findProductRecordById: jest.fn(),
    findActiveProductBySku: jest.fn(),
    findActiveProductByBarcode: jest.fn(),
    findProducts: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    softDeleteProduct: jest.fn(),
    findWarehouseById: jest.fn(),
    findWarehouseByCode: jest.fn(),
    findWarehouses: jest.fn(),
    createWarehouse: jest.fn(),
    updateWarehouse: jest.fn(),
    softDeleteWarehouse: jest.fn(),
    createMovement: jest.fn(),
    findKardex: jest.fn(),
    findStock: jest.fn(),
    findStockByProduct: jest.fn(),
    findStockByWarehouse: jest.fn()
  };
  const auditService = { log: jest.fn() };
  let service: InventoryService;

  function getCreateMovementCall(): { quantity: Prisma.Decimal; unitCost: Prisma.Decimal } {
    const calls = repository.createMovement.mock.calls as unknown as Array<
      [{ quantity: Prisma.Decimal; unitCost: Prisma.Decimal }]
    >;
    return calls[0][0];
  }

  beforeEach(() => {
    jest.clearAllMocks();
    service = new InventoryService(repository as never, auditService as never);
  });

  it('crea categoría', async () => {
    repository.findActiveCategoryByName.mockResolvedValue(null);
    repository.createCategory.mockResolvedValue(category);

    const result = await service.createCategory({ name: ' Filtros ' }, 'actor-id');

    expect(result).toEqual(category);
    expect(repository.createCategory).toHaveBeenCalledWith(expect.objectContaining({ name: 'Filtros' }));
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({ module: 'inventory' }));
  });

  it('rechaza categoría duplicada', async () => {
    repository.findActiveCategoryByName.mockResolvedValue(category);

    await expect(service.createCategory({ name: 'Filtros' }, 'actor-id')).rejects.toThrow(ConflictException);
  });

  it('crea producto normalizando SKU', async () => {
    repository.findCategoryById.mockResolvedValue(category);
    repository.findActiveProductBySku.mockResolvedValue(null);
    repository.findActiveProductByBarcode.mockResolvedValue(null);
    repository.createProduct.mockResolvedValue(product);

    const result = await service.createProduct(
      {
        sku: ' fil-001 ',
        barcode: '123456',
        name: 'Filtro de aceite',
        categoryId: 'category-id',
        unit: InventoryUnit.UNIT,
        costPrice: 10,
        salePrice: 15,
        minimumStock: 2,
        maximumStock: 20
      },
      'actor-id'
    );

    expect(result).toEqual(product);
    expect(repository.createProduct).toHaveBeenCalledWith(expect.objectContaining({ sku: 'FIL-001' }));
  });

  it('rechaza SKU duplicado', async () => {
    repository.findCategoryById.mockResolvedValue(category);
    repository.findActiveProductBySku.mockResolvedValue({ id: 'other-id' });

    await expect(
      service.createProduct(
        {
          sku: 'FIL-001',
          name: 'Filtro',
          categoryId: 'category-id',
          unit: InventoryUnit.UNIT,
          costPrice: 1,
          salePrice: 2,
          minimumStock: 0
        },
        'actor-id'
      )
    ).rejects.toThrow(ConflictException);
  });

  it('rechaza código de barras duplicado', async () => {
    repository.findCategoryById.mockResolvedValue(category);
    repository.findActiveProductBySku.mockResolvedValue(null);
    repository.findActiveProductByBarcode.mockResolvedValue({ id: 'other-id' });

    await expect(
      service.createProduct(
        {
          sku: 'FIL-002',
          barcode: '123456',
          name: 'Filtro',
          categoryId: 'category-id',
          unit: InventoryUnit.UNIT,
          costPrice: 1,
          salePrice: 2,
          minimumStock: 0
        },
        'actor-id'
      )
    ).rejects.toThrow(ConflictException);
  });

  it('rechaza stock máximo menor al mínimo', async () => {
    repository.findCategoryById.mockResolvedValue(category);

    await expect(
      service.createProduct(
        {
          sku: 'FIL-003',
          name: 'Filtro',
          categoryId: 'category-id',
          unit: InventoryUnit.UNIT,
          costPrice: 1,
          salePrice: 2,
          minimumStock: 5,
          maximumStock: 2
        },
        'actor-id'
      )
    ).rejects.toThrow(BadRequestException);
  });

  it('crea bodega y normaliza código', async () => {
    repository.findWarehouseByCode.mockResolvedValue(null);
    repository.createWarehouse.mockResolvedValue(warehouse);

    const result = await service.createWarehouse({ code: ' main ', name: 'Bodega principal', isMain: true }, 'actor-id');

    expect(result).toEqual(warehouse);
    expect(repository.createWarehouse).toHaveBeenCalledWith(expect.objectContaining({ code: 'MAIN', isMain: true }));
  });

  it('mantiene una sola bodega principal mediante el repositorio transaccional', async () => {
    repository.findWarehouseById.mockResolvedValue({ ...warehouse, stockTotal: 0 });
    repository.findWarehouseByCode.mockResolvedValue(null);
    repository.updateWarehouse.mockResolvedValue({ ...warehouse, id: 'new-main' });

    await service.updateWarehouse('new-main', { isMain: true }, 'actor-id');

    expect(repository.updateWarehouse).toHaveBeenCalledWith(
      'new-main',
      expect.objectContaining({ isMain: true })
    );
  });

  it('rechaza eliminar bodega con stock', async () => {
    repository.findWarehouseById.mockResolvedValue(warehouse);

    await expect(service.deleteWarehouse('warehouse-id', 'actor-id')).rejects.toThrow(BadRequestException);
  });

  it('crea stock inicial', async () => {
    repository.findProductRecordById.mockResolvedValue(product);
    repository.findWarehouseById.mockResolvedValue(warehouse);
    repository.createMovement.mockResolvedValue({ id: 'movement-id', movementNumber: 'MOV-000001' });

    const result = await service.createMovement(
      {
        productId: 'product-id',
        warehouseId: 'warehouse-id',
        movementType: StockMovementType.INITIAL,
        quantity: 5,
        unitCost: 10,
        reason: 'Stock inicial'
      },
      'actor-id'
    );

    expect(result).toEqual({ id: 'movement-id', movementNumber: 'MOV-000001' });
    const call = getCreateMovementCall();
    expect(call.quantity.toString()).toBe('5');
    expect(call.unitCost.toString()).toBe('10');
  });

  it('crea entrada manual', async () => {
    repository.findProductRecordById.mockResolvedValue(product);
    repository.findWarehouseById.mockResolvedValue(warehouse);
    repository.createMovement.mockResolvedValue({ id: 'movement-id' });

    await service.createMovement(
      {
        productId: 'product-id',
        warehouseId: 'warehouse-id',
        movementType: StockMovementType.MANUAL_ENTRY,
        quantity: 3,
        unitCost: 11,
        reason: 'Ingreso manual'
      },
      'actor-id'
    );

    expect(repository.createMovement).toHaveBeenCalled();
  });

  it('crea salida manual usando costo promedio', async () => {
    repository.findProductRecordById.mockResolvedValue(product);
    repository.findWarehouseById.mockResolvedValue(warehouse);
    repository.createMovement.mockResolvedValue({ id: 'movement-id' });

    await service.createMovement(
      {
        productId: 'product-id',
        warehouseId: 'warehouse-id',
        movementType: StockMovementType.TRANSFER_OUT,
        quantity: 2
      },
      'actor-id'
    );

    const call = getCreateMovementCall();
    expect(call.unitCost.toString()).toBe('12');
  });

  it('rechaza salida con stock insuficiente', async () => {
    repository.findProductRecordById.mockResolvedValue(product);
    repository.findWarehouseById.mockResolvedValue(warehouse);
    repository.createMovement.mockRejectedValue(new Error('INSUFFICIENT_STOCK'));

    await expect(
      service.createMovement(
        {
          productId: 'product-id',
          warehouseId: 'warehouse-id',
          movementType: StockMovementType.TRANSFER_OUT,
          quantity: 99
        },
        'actor-id'
      )
    ).rejects.toThrow(BadRequestException);
  });

  it('consulta stock por bodega', async () => {
    repository.findWarehouseById.mockResolvedValue(warehouse);
    repository.findStockByWarehouse.mockResolvedValue({ items: [] });

    const result = await service.findStockByWarehouse('warehouse-id', { page: 1, limit: 10 });

    expect(result).toEqual({ items: [] });
  });

  it('consulta kardex', async () => {
    repository.findProductById.mockResolvedValue(product);
    repository.findKardex.mockResolvedValue({ items: [{ movementNumber: 'MOV-000001' }] });

    const result = await service.findKardex('product-id', { page: 1, limit: 10 });

    expect(result).toEqual({ items: [{ movementNumber: 'MOV-000001' }] });
  });

  it('elimina producto de forma lógica', async () => {
    repository.findProductById.mockResolvedValue(product);
    repository.softDeleteProduct.mockResolvedValue({ ...product, isActive: false });

    const result = await service.deleteProduct('product-id', 'actor-id');

    expect(result).toEqual({ ...product, isActive: false });
  });

  it('rechaza producto inexistente', async () => {
    repository.findProductById.mockResolvedValue(null);

    await expect(service.findProductById('missing-id')).rejects.toThrow(NotFoundException);
  });
});
