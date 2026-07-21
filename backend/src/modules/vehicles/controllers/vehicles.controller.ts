import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { VehicleQueryDto } from '../dto/vehicle-query.dto';
import { VehiclesService } from '../services/vehicles.service';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post('vehicles')
  @Permissions('vehicles.create')
  async create(@Body() dto: CreateVehicleDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Vehículo creado correctamente', data: await this.vehiclesService.create(dto, user.id) };
  }

  @Get('vehicles')
  @Permissions('vehicles.read')
  async findAll(@Query() query: VehicleQueryDto) {
    return { data: await this.vehiclesService.findAll(query) };
  }

  @Get('vehicles/:id')
  @Permissions('vehicles.read')
  async findById(@Param('id') id: string) {
    return { data: await this.vehiclesService.findById(id) };
  }

  @Patch('vehicles/:id')
  @Permissions('vehicles.update')
  async update(@Param('id') id: string, @Body() dto: UpdateVehicleDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Vehículo actualizado correctamente', data: await this.vehiclesService.update(id, dto, user.id) };
  }

  @Patch('vehicles/:id/activate')
  @Permissions('vehicles.change-status')
  async activate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Vehículo activado correctamente', data: await this.vehiclesService.activate(id, user.id) };
  }

  @Patch('vehicles/:id/deactivate')
  @Permissions('vehicles.change-status')
  async deactivate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Vehículo desactivado correctamente', data: await this.vehiclesService.deactivate(id, user.id) };
  }

  @Delete('vehicles/:id')
  @Permissions('vehicles.delete')
  async softDelete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Vehículo eliminado correctamente', data: await this.vehiclesService.softDelete(id, user.id) };
  }

  @Get('customers/:customerId/vehicles')
  @Permissions('vehicles.read')
  async findByCustomerId(@Param('customerId') customerId: string, @Query() query: VehicleQueryDto) {
    return { data: await this.vehiclesService.findByCustomerId(customerId, query) };
  }
}
