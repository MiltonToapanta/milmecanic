import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { InventoryProductQueryDto } from '../dto/inventory-product-query.dto';
import { SimpleInventoryQueryDto } from '../dto/simple-inventory-query.dto';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';
import { InventoryService } from '../services/inventory.service';

@ApiTags('inventory-warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory/warehouses')
export class InventoryWarehousesController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Permissions('inventory.warehouses.manage')
  create(@Body() dto: CreateWarehouseDto, @CurrentUser('id') actorId?: string) {
    return this.inventoryService.createWarehouse(dto, actorId);
  }

  @Get()
  @Permissions('inventory.read')
  findAll(@Query() query: SimpleInventoryQueryDto) {
    return this.inventoryService.findWarehouses(query);
  }

  @Get(':id')
  @Permissions('inventory.read')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findWarehouseById(id);
  }

  @Patch(':id')
  @Permissions('inventory.warehouses.manage')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseDto,
    @CurrentUser('id') actorId?: string
  ) {
    return this.inventoryService.updateWarehouse(id, dto, actorId);
  }

  @Delete(':id')
  @Permissions('inventory.warehouses.manage')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') actorId?: string) {
    return this.inventoryService.deleteWarehouse(id, actorId);
  }

  @Get(':warehouseId/stock')
  @Permissions('inventory.read')
  stockByWarehouse(
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Query() query: InventoryProductQueryDto
  ) {
    return this.inventoryService.findStockByWarehouse(warehouseId, query);
  }
}
