import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../permissions/decorators/permissions.decorator';
import { PermissionsGuard } from '../../permissions/guards/permissions.guard';
import { AppointmentQueryDto } from '../dto/appointment-query.dto';
import { ChangeAppointmentStatusDto } from '../dto/change-appointment-status.dto';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { AppointmentsService } from '../services/appointments.service';

@ApiTags('Appointments')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('appointments')
  @Permissions('appointments.create')
  async create(@Body() dto: CreateAppointmentDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Cita creada correctamente', data: await this.appointmentsService.create(dto, user.id) };
  }

  @Get('appointments')
  @Permissions('appointments.read')
  async findAll(@Query() query: AppointmentQueryDto) {
    return { data: await this.appointmentsService.findAll(query) };
  }

  @Get('appointments/:id')
  @Permissions('appointments.read')
  async findById(@Param('id') id: string) {
    return { data: await this.appointmentsService.findById(id) };
  }

  @Patch('appointments/:id')
  @Permissions('appointments.update')
  async update(@Param('id') id: string, @Body() dto: UpdateAppointmentDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Cita actualizada correctamente', data: await this.appointmentsService.update(id, dto, user.id) };
  }

  @Patch('appointments/:id/status')
  @Permissions('appointments.change-status')
  async changeStatus(@Param('id') id: string, @Body() dto: ChangeAppointmentStatusDto, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Estado de la cita actualizado correctamente', data: await this.appointmentsService.changeStatus(id, dto, user.id) };
  }

  @Delete('appointments/:id')
  @Permissions('appointments.delete')
  async softDelete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return { message: 'Cita eliminada correctamente', data: await this.appointmentsService.softDelete(id, user.id) };
  }

  @Get('customers/:customerId/appointments')
  @Permissions('appointments.read')
  async findByCustomerId(@Param('customerId') customerId: string, @Query() query: AppointmentQueryDto) {
    return { data: await this.appointmentsService.findByCustomerId(customerId, query) };
  }

  @Get('vehicles/:vehicleId/appointments')
  @Permissions('appointments.read')
  async findByVehicleId(@Param('vehicleId') vehicleId: string, @Query() query: AppointmentQueryDto) {
    return { data: await this.appointmentsService.findByVehicleId(vehicleId, query) };
  }
}
