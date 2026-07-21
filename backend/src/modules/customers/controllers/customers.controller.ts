import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { CustomerQueryDto } from '../dto/customer-query.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CustomersService } from '../services/customers.service';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Permissions('customers.create')
  async create(@Body() dto: CreateCustomerDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Cliente creado correctamente', data: await this.customersService.create(dto, user.id) };
  }

  @Get()
  @Permissions('customers.read')
  async findAll(@Query() query: CustomerQueryDto) {
    return { data: await this.customersService.findAll(query) };
  }

  @Get(':id')
  @Permissions('customers.read')
  async findById(@Param('id') id: string) {
    return { data: await this.customersService.findById(id) };
  }

  @Patch(':id')
  @Permissions('customers.update')
  async update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Cliente actualizado correctamente', data: await this.customersService.update(id, dto, user.id) };
  }

  @Patch(':id/activate')
  @Permissions('customers.change-status')
  async activate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Cliente activado correctamente', data: await this.customersService.activate(id, user.id) };
  }

  @Patch(':id/deactivate')
  @Permissions('customers.change-status')
  async deactivate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Cliente desactivado correctamente', data: await this.customersService.deactivate(id, user.id) };
  }

  @Delete(':id')
  @Permissions('customers.delete')
  async softDelete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Cliente eliminado correctamente', data: await this.customersService.softDelete(id, user.id) };
  }
}
