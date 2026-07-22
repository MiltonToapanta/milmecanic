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
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import { CreateQuotationItemDto } from '../dto/quotation-item.dto';
import { QuotationQueryDto } from '../dto/quotation-query.dto';
import { UpdateQuotationDto } from '../dto/update-quotation.dto';
import { QuotationsService } from '../services/quotations.service';

@ApiTags('quotations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post('quotations')
  @Permissions('quotations.create')
  create(@Body() dto: CreateQuotationDto, @CurrentUser('id') actorId?: string) {
    return this.quotationsService.create(dto, actorId);
  }

  @Get('quotations')
  @Permissions('quotations.read')
  findAll(@Query() query: QuotationQueryDto) {
    return this.quotationsService.findAll(query);
  }

  @Get('quotations/:id')
  @Permissions('quotations.read')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotationsService.findById(id);
  }

  @Patch('quotations/:id')
  @Permissions('quotations.update')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateQuotationDto,
    @CurrentUser('id') actorId?: string
  ) {
    return this.quotationsService.update(id, dto, actorId);
  }

  @Delete('quotations/:id')
  @Permissions('quotations.delete')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') actorId?: string) {
    return this.quotationsService.softDelete(id, actorId);
  }

  @Get('service-orders/:serviceOrderId/quotations')
  @Permissions('quotations.read')
  findByServiceOrder(
    @Param('serviceOrderId', ParseUUIDPipe) serviceOrderId: string,
    @Query() query: QuotationQueryDto
  ) {
    return this.quotationsService.findByServiceOrderId(serviceOrderId, query);
  }

  @Post('quotations/:id/items')
  @Permissions('quotations.update')
  addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateQuotationItemDto,
    @CurrentUser('id') actorId?: string
  ) {
    return this.quotationsService.addItem(id, dto, actorId);
  }

  @Patch('quotations/:id/items/:itemId')
  @Permissions('quotations.update')
  updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: CreateQuotationItemDto,
    @CurrentUser('id') actorId?: string
  ) {
    return this.quotationsService.updateItem(id, itemId, dto, actorId);
  }

  @Delete('quotations/:id/items/:itemId')
  @Permissions('quotations.update')
  removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUser('id') actorId?: string
  ) {
    return this.quotationsService.removeItem(id, itemId, actorId);
  }

  @Patch('quotations/:id/send')
  @Permissions('quotations.send')
  send(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') actorId?: string) {
    return this.quotationsService.send(id, actorId);
  }

  @Patch('quotations/:id/approve')
  @Permissions('quotations.approve')
  approve(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') actorId?: string) {
    return this.quotationsService.approve(id, actorId);
  }

  @Patch('quotations/:id/reject')
  @Permissions('quotations.reject')
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('rejectionReason') rejectionReason?: string,
    @CurrentUser('id') actorId?: string
  ) {
    return this.quotationsService.reject(id, rejectionReason, actorId);
  }

  @Patch('quotations/:id/cancel')
  @Permissions('quotations.cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') actorId?: string) {
    return this.quotationsService.cancel(id, actorId);
  }
}
