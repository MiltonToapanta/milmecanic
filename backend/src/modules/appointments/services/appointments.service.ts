import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AppointmentStatus, Prisma } from '@prisma/client';
import { AuditService } from '../../audit/services/audit.service';
import { AppointmentQueryDto } from '../dto/appointment-query.dto';
import { ChangeAppointmentStatusDto } from '../dto/change-appointment-status.dto';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { AppointmentsRepository, AppointmentResponse } from '../repositories/appointments.repository';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly appointmentsRepository: AppointmentsRepository,
    private readonly auditService: AuditService
  ) {}

  findAll(query: AppointmentQueryDto) {
    return this.appointmentsRepository.findAll(query);
  }

  async findByCustomerId(customerId: string, query: AppointmentQueryDto) {
    await this.ensureCustomerCanSchedule(customerId);
    return this.appointmentsRepository.findAll({ ...query, customerId });
  }

  async findByVehicleId(vehicleId: string, query: AppointmentQueryDto) {
    await this.ensureVehicleCanSchedule(vehicleId);
    return this.appointmentsRepository.findAll({ ...query, vehicleId });
  }

  async findById(id: string) {
    const appointment = await this.appointmentsRepository.findById(id);
    if (!appointment) throw new NotFoundException('Cita no encontrada');
    return appointment;
  }

  async create(dto: CreateAppointmentDto, actorId?: string) {
    await this.ensureAppointmentRelations(dto.customerId, dto.vehicleId, dto.assignedUserId);
    const appointment = await this.appointmentsRepository.create({
      ...this.toCreateData(dto),
      customer: { connect: { id: dto.customerId } },
      vehicle: { connect: { id: dto.vehicleId } },
      assignedUser: dto.assignedUserId ? { connect: { id: dto.assignedUserId } } : undefined,
      createdBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.audit('create', appointment, actorId, undefined, appointment);
    return appointment;
  }

  async update(id: string, dto: UpdateAppointmentDto, actorId?: string) {
    const oldAppointment = await this.findById(id);
    const customerId = dto.customerId ?? oldAppointment.customerId;
    const vehicleId = dto.vehicleId ?? oldAppointment.vehicleId;
    await this.ensureAppointmentRelations(customerId, vehicleId, dto.assignedUserId);

    const appointment = await this.appointmentsRepository.update(id, {
      ...this.toUpdateData(dto),
      customer: dto.customerId ? { connect: { id: dto.customerId } } : undefined,
      vehicle: dto.vehicleId ? { connect: { id: dto.vehicleId } } : undefined,
      assignedUser: dto.assignedUserId ? { connect: { id: dto.assignedUserId } } : undefined,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.audit('update', appointment, actorId, oldAppointment, appointment);
    return appointment;
  }

  async changeStatus(id: string, dto: ChangeAppointmentStatusDto, actorId?: string) {
    const oldAppointment = await this.findById(id);
    this.ensureStatusChangeIsAllowed(oldAppointment.status, dto);

    const appointment = await this.appointmentsRepository.update(id, {
      status: dto.status,
      cancellationReason: dto.status === AppointmentStatus.CANCELLED ? dto.cancellationReason?.trim() : null,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.audit(dto.status === AppointmentStatus.CANCELLED ? 'cancel' : 'change-status', appointment, actorId, oldAppointment, appointment);
    return appointment;
  }

  async softDelete(id: string, actorId?: string) {
    const oldAppointment = await this.findById(id);
    const appointment = await this.appointmentsRepository.update(id, {
      deletedAt: new Date(),
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.audit('delete', appointment, actorId, oldAppointment, appointment);
    return appointment;
  }

  private async ensureAppointmentRelations(customerId: string, vehicleId: string, assignedUserId?: string): Promise<void> {
    await this.ensureCustomerCanSchedule(customerId);
    const vehicle = await this.ensureVehicleCanSchedule(vehicleId);
    if (vehicle.customerId !== customerId) throw new BadRequestException('El vehículo seleccionado no pertenece al cliente');
    if (assignedUserId) await this.ensureAssignedUserExists(assignedUserId);
  }

  private async ensureCustomerCanSchedule(customerId: string): Promise<void> {
    const customer = await this.appointmentsRepository.findActiveCustomerById(customerId);
    if (!customer) throw new NotFoundException('Cliente no encontrado o inactivo');
  }

  private async ensureVehicleCanSchedule(vehicleId: string): Promise<{ id: string; customerId: string }> {
    const vehicle = await this.appointmentsRepository.findActiveVehicleById(vehicleId);
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado o inactivo');
    return vehicle;
  }

  private async ensureAssignedUserExists(userId: string): Promise<void> {
    const user = await this.appointmentsRepository.findActiveUserById(userId);
    if (!user) throw new NotFoundException('Usuario asignado no encontrado o inactivo');
  }

  private ensureStatusChangeIsAllowed(currentStatus: AppointmentStatus, dto: ChangeAppointmentStatusDto): void {
    if (dto.status === AppointmentStatus.CANCELLED && !dto.cancellationReason?.trim()) {
      throw new BadRequestException('El motivo de cancelación es obligatorio');
    }
    if (currentStatus === AppointmentStatus.COMPLETED && dto.status === AppointmentStatus.SCHEDULED) {
      throw new BadRequestException('Una cita completada no puede volver a programada');
    }
    if (currentStatus === AppointmentStatus.CANCELLED && dto.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Una cita cancelada no puede pasar directamente a completada');
    }
  }

  private toCreateData(dto: CreateAppointmentDto): Omit<Prisma.AppointmentCreateInput, 'customer' | 'vehicle' | 'assignedUser' | 'createdBy'> {
    return {
      scheduledAt: dto.scheduledAt,
      estimatedDurationMinutes: dto.estimatedDurationMinutes,
      reason: dto.reason.trim(),
      notes: normalizeOptional(dto.notes)
    };
  }

  private toUpdateData(dto: UpdateAppointmentDto): Omit<Prisma.AppointmentUpdateInput, 'customer' | 'vehicle' | 'assignedUser' | 'updatedBy'> {
    return {
      scheduledAt: dto.scheduledAt,
      estimatedDurationMinutes: dto.estimatedDurationMinutes,
      reason: dto.reason?.trim(),
      notes: normalizeOptional(dto.notes)
    };
  }

  private async audit(
    action: string,
    appointment: AppointmentResponse,
    actorId?: string,
    oldValues?: AppointmentResponse,
    newValues?: AppointmentResponse
  ): Promise<void> {
    await this.auditService.log({
      userId: actorId,
      action,
      module: 'appointments',
      entity: 'Appointment',
      entityId: appointment.id,
      oldValues,
      newValues
    });
  }
}

function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
