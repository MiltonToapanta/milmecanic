import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { InventoryCategoriesController } from './controllers/inventory-categories.controller';
import { InventoryMovementsController } from './controllers/inventory-movements.controller';
import { InventoryProductsController } from './controllers/inventory-products.controller';
import { InventoryWarehousesController } from './controllers/inventory-warehouses.controller';
import { InventoryRepository } from './repositories/inventory.repository';
import { InventoryService } from './services/inventory.service';

@Module({
  imports: [AuditModule],
  controllers: [
    InventoryProductsController,
    InventoryCategoriesController,
    InventoryWarehousesController,
    InventoryMovementsController
  ],
  providers: [InventoryService, InventoryRepository],
  exports: [InventoryService]
})
export class InventoryModule {}
