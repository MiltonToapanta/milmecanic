import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { CreateStockMovementDto } from '../dto/create-stock-movement.dto';
import { InventoryProductQueryDto } from '../dto/inventory-product-query.dto';
import { InventoryService } from '../services/inventory.service';

@ApiTags('inventory-movements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryMovementsController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('movements')
  @Permissions('inventory.movements.create')
  create(@Body() dto: CreateStockMovementDto, @CurrentUser('id') actorId?: string) {
    return this.inventoryService.createMovement(dto, actorId);
  }

  @Get('stock')
  @Permissions('inventory.read')
  stock(@Query() query: InventoryProductQueryDto) {
    return this.inventoryService.findStock(query);
  }

  @Get('stock/:productId')
  @Permissions('inventory.read')
  stockByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.inventoryService.findStockByProduct(productId);
  }
}
