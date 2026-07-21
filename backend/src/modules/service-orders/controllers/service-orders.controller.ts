import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { ChangeServiceOrderStatusDto } from '../dto/change-service-order-status.dto';
import { CreateServiceOrderDto } from '../dto/create-service-order.dto';
import { ServiceOrderQueryDto } from '../dto/service-order-query.dto';
import { UpdateServiceOrderDto } from '../dto/update-service-order.dto';
import { ServiceOrdersService } from '../services/service-orders.service';

@ApiTags('Service orders')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ServiceOrdersController {
  constructor(private readonly serviceOrdersService: ServiceOrdersService) {}

  @Post('service-orders')
  @Permissions('service-orders.create')
  async create(@Body() dto: CreateServiceOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Orden de servicio creada correctamente', data: await this.serviceOrdersService.create(dto, user.id) };
  }

  @Get('service-orders')
  @Permissions('service-orders.read')
  async findAll(@Query() query: ServiceOrderQueryDto) {
    return { data: await this.serviceOrdersService.findAll(query) };
  }

  @Get('service-orders/:id')
  @Permissions('service-orders.read')
  async findById(@Param('id') id: string) {
    return { data: await this.serviceOrdersService.findById(id) };
  }

  @Patch('service-orders/:id')
  @Permissions('service-orders.update')
  async update(@Param('id') id: string, @Body() dto: UpdateServiceOrderDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Orden de servicio actualizada correctamente', data: await this.serviceOrdersService.update(id, dto, user.id) };
  }

  @Patch('service-orders/:id/status')
  @Permissions('service-orders.change-status')
  async changeStatus(@Param('id') id: string, @Body() dto: ChangeServiceOrderStatusDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Estado de la orden actualizado correctamente', data: await this.serviceOrdersService.changeStatus(id, dto, user.id) };
  }

  @Delete('service-orders/:id')
  @Permissions('service-orders.delete')
  async softDelete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Orden de servicio eliminada correctamente', data: await this.serviceOrdersService.softDelete(id, user.id) };
  }

  @Get('customers/:customerId/service-orders')
  @Permissions('service-orders.read')
  async findByCustomerId(@Param('customerId') customerId: string, @Query() query: ServiceOrderQueryDto) {
    return { data: await this.serviceOrdersService.findByCustomerId(customerId, query) };
  }

  @Get('vehicles/:vehicleId/service-orders')
  @Permissions('service-orders.read')
  async findByVehicleId(@Param('vehicleId') vehicleId: string, @Query() query: ServiceOrderQueryDto) {
    return { data: await this.serviceOrdersService.findByVehicleId(vehicleId, query) };
  }

  @Get('users/:userId/service-orders')
  @Permissions('service-orders.read')
  async findByUserId(@Param('userId') userId: string, @Query() query: ServiceOrderQueryDto) {
    return { data: await this.serviceOrdersService.findByUserId(userId, query) };
  }
}
