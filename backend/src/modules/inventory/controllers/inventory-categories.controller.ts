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
import { CreateInventoryCategoryDto } from '../dto/create-inventory-category.dto';
import { SimpleInventoryQueryDto } from '../dto/simple-inventory-query.dto';
import { UpdateInventoryCategoryDto } from '../dto/update-inventory-category.dto';
import { InventoryService } from '../services/inventory.service';

@ApiTags('inventory-categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory/categories')
export class InventoryCategoriesController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Permissions('inventory.categories.manage')
  create(@Body() dto: CreateInventoryCategoryDto, @CurrentUser('id') actorId?: string) {
    return this.inventoryService.createCategory(dto, actorId);
  }

  @Get()
  @Permissions('inventory.read')
  findAll(@Query() query: SimpleInventoryQueryDto) {
    return this.inventoryService.findCategories(query);
  }

  @Get(':id')
  @Permissions('inventory.read')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.inventoryService.findCategoryById(id);
  }

  @Patch(':id')
  @Permissions('inventory.categories.manage')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInventoryCategoryDto,
    @CurrentUser('id') actorId?: string
  ) {
    return this.inventoryService.updateCategory(id, dto, actorId);
  }

  @Delete(':id')
  @Permissions('inventory.categories.manage')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') actorId?: string) {
    return this.inventoryService.deleteCategory(id, actorId);
  }
}
