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
import { CreateInventoryProductDto } from '../dto/create-inventory-product.dto';
import { InventoryProductQueryDto } from '../dto/inventory-product-query.dto';
import { StockMovementQueryDto } from '../dto/stock-movement-query.dto';
import { UpdateInventoryProductDto } from '../dto/update-inventory-product.dto';
import { InventoryService } from '../services/inventory.service';

@ApiTags('inventory-products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryProductsController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('products')
  @Permissions('inventory.products.create')
  create(@Body() dto: CreateInventoryProductDto, @CurrentUser('id') actorId?: string) {
    return this.inventoryService.createProduct(dto, actorId);
  }

  @Get('products')
  @Permissions('inventory.read')
  findAll(@Query() query: InventoryProductQueryDto) {
    return this.inventoryService.findProducts(query);
  }

  @Get('products/:id')
  @Permissions('inventory.read')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findProductById(id);
  }

  @Patch('products/:id')
  @Permissions('inventory.products.update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryProductDto,
    @CurrentUser('id') actorId?: string
  ) {
    return this.inventoryService.updateProduct(id, dto, actorId);
  }

  @Delete('products/:id')
  @Permissions('inventory.products.delete')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') actorId?: string) {
    return this.inventoryService.deleteProduct(id, actorId);
  }

  @Get('products/:productId/kardex')
  @Permissions('inventory.kardex.read')
  kardex(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query() query: StockMovementQueryDto
  ) {
    return this.inventoryService.findKardex(productId, query);
  }
}
