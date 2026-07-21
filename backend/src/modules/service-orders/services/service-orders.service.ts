import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ServiceOrderStatus } from '@prisma/client';
import { AuditService } from '../../audit/services/audit.service';
import { ChangeServiceOrderStatusDto } from '../dto/change-service-order-status.dto';
import { CreateServiceOrderDto } from '../dto/create-service-order.dto';
import { ServiceOrderQueryDto } from '../dto/service-order-query.dto';
import { UpdateServiceOrderDto } from '../dto/update-service-order.dto';
import { ServiceOrderResponse, ServiceOrdersRepository } from '../repositories/service-orders.repository';

const allowedTransitions: Record<ServiceOrderStatus, ServiceOrderStatus[]> = {
  [ServiceOrderStatus.RECEIVED]: [ServiceOrderStatus.DIAGNOSIS, ServiceOrderStatus.CANCELLED],
  [ServiceOrderStatus.DIAGNOSIS]: [ServiceOrderStatus.WAITING_APPROVAL, ServiceOrderStatus.CANCELLED],
  [ServiceOrderStatus.WAITING_APPROVAL]: [ServiceOrderStatus.APPROVED, ServiceOrderStatus.CANCELLED],
  [ServiceOrderStatus.APPROVED]: [ServiceOrderStatus.IN_REPAIR, ServiceOrderStatus.CANCELLED],
  [ServiceOrderStatus.IN_REPAIR]: [ServiceOrderStatus.QUALITY_CONTROL, ServiceOrderStatus.CANCELLED],
  [ServiceOrderStatus.QUALITY_CONTROL]: [ServiceOrderStatus.READY_FOR_DELIVERY, ServiceOrderStatus.CANCELLED],
  [ServiceOrderStatus.READY_FOR_DELIVERY]: [ServiceOrderStatus.DELIVERED, ServiceOrderStatus.CANCELLED],
  [ServiceOrderStatus.DELIVERED]: [],
  [ServiceOrderStatus.CANCELLED]: []
};

@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly serviceOrdersRepository: ServiceOrdersRepository,
    private readonly auditService: AuditService
  ) {}

  findAll(query: ServiceOrderQueryDto) {
    return this.serviceOrdersRepository.findAll(query);
  }

  async findByCustomerId(customerId: string, query: ServiceOrderQueryDto) {
    await this.ensureCustomerCanReceiveOrder(customerId);
    return this.serviceOrdersRepository.findAll({ ...query, customerId });
  }

  async findByVehicleId(vehicleId: string, query: ServiceOrderQueryDto) {
    await this.ensureVehicleCanReceiveOrder(vehicleId);
    return this.serviceOrdersRepository.findAll({ ...query, vehicleId });
  }

  async findByUserId(userId: string, query: ServiceOrderQueryDto) {
    await this.ensureUserExists(userId, 'Usuario no encontrado o inactivo');
    return this.serviceOrdersRepository.findAll({
      ...query,
      assignedAdvisorId: query.assignedAdvisorId ?? userId,
      assignedMechanicId: query.assignedMechanicId
    });
  }

  async findById(id: string) {
    const serviceOrder = await this.serviceOrdersRepository.findById(id);
    if (!serviceOrder) throw new NotFoundException('Orden de servicio no encontrada');
    return serviceOrder;
  }

  async create(dto: CreateServiceOrderDto, actorId?: string) {
    await this.ensureServiceOrderRelations(dto.customerId, dto.vehicleId, dto.appointmentId, dto.assignedAdvisorId, dto.assignedMechanicId);
    const prefix = await this.serviceOrdersRepository.getServiceOrderPrefix();
    const serviceOrder = await this.serviceOrdersRepository.createTransactional({
      prefix,
      data: {
        ...this.toCreateData(dto),
        status: ServiceOrderStatus.RECEIVED,
        customer: { connect: { id: dto.customerId } },
        vehicle: { connect: { id: dto.vehicleId } },
        appointment: dto.appointmentId ? { connect: { id: dto.appointmentId } } : undefined,
        assignedAdvisor: dto.assignedAdvisorId ? { connect: { id: dto.assignedAdvisorId } } : undefined,
        assignedMechanic: dto.assignedMechanicId ? { connect: { id: dto.assignedMechanicId } } : undefined,
        createdBy: actorId ? { connect: { id: actorId } } : undefined
      }
    });

    await this.audit('create', serviceOrder, actorId, undefined, serviceOrder);
    return serviceOrder;
  }

  async update(id: string, dto: UpdateServiceOrderDto, actorId?: string) {
    const oldServiceOrder = await this.findById(id);
    this.ensureEditable(oldServiceOrder);

    const customerId = dto.customerId ?? oldServiceOrder.customerId;
    const vehicleId = dto.vehicleId ?? oldServiceOrder.vehicleId;
    const appointmentId = dto.appointmentId ?? oldServiceOrder.appointmentId ?? undefined;
    await this.ensureServiceOrderRelations(customerId, vehicleId, appointmentId, dto.assignedAdvisorId, dto.assignedMechanicId);

    const serviceOrder = await this.serviceOrdersRepository.update(id, {
      ...this.toUpdateData(dto),
      customer: dto.customerId ? { connect: { id: dto.customerId } } : undefined,
      vehicle: dto.vehicleId ? { connect: { id: dto.vehicleId } } : undefined,
      appointment: dto.appointmentId ? { connect: { id: dto.appointmentId } } : undefined,
      assignedAdvisor: dto.assignedAdvisorId ? { connect: { id: dto.assignedAdvisorId } } : undefined,
      assignedMechanic: dto.assignedMechanicId ? { connect: { id: dto.assignedMechanicId } } : undefined,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });

    await this.audit(getUpdateAuditAction(oldServiceOrder, serviceOrder), serviceOrder, actorId, oldServiceOrder, serviceOrder);
    return serviceOrder;
  }

  async changeStatus(id: string, dto: ChangeServiceOrderStatusDto, actorId?: string) {
    const oldServiceOrder = await this.findById(id);
    this.ensureStatusTransitionIsAllowed(oldServiceOrder.status, dto);

    const now = new Date();
    const statusDates: Prisma.ServiceOrderUpdateInput = {};
    if (dto.status === ServiceOrderStatus.IN_REPAIR && !oldServiceOrder.startedAt) statusDates.startedAt = now;
    if (dto.status === ServiceOrderStatus.READY_FOR_DELIVERY) statusDates.completedAt = now;
    if (dto.status === ServiceOrderStatus.DELIVERED) statusDates.deliveredAt = now;

    const serviceOrder = await this.serviceOrdersRepository.update(id, {
      ...statusDates,
      status: dto.status,
      cancellationReason: dto.status === ServiceOrderStatus.CANCELLED ? dto.cancellationReason?.trim() : null,
      isActive: dto.status === ServiceOrderStatus.CANCELLED ? false : oldServiceOrder.isActive,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });

    await this.audit(dto.status === ServiceOrderStatus.CANCELLED ? 'cancel' : 'change-status', serviceOrder, actorId, oldServiceOrder, serviceOrder);
    return serviceOrder;
  }

  async softDelete(id: string, actorId?: string) {
    const oldServiceOrder = await this.findById(id);
    const serviceOrder = await this.serviceOrdersRepository.update(id, {
      deletedAt: new Date(),
      isActive: false,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.audit('delete', serviceOrder, actorId, oldServiceOrder, serviceOrder);
    return serviceOrder;
  }

  private async ensureServiceOrderRelations(
    customerId: string,
    vehicleId: string,
    appointmentId?: string,
    assignedAdvisorId?: string,
    assignedMechanicId?: string
  ): Promise<void> {
    await this.ensureCustomerCanReceiveOrder(customerId);
    const vehicle = await this.ensureVehicleCanReceiveOrder(vehicleId);
    if (vehicle.customerId !== customerId) throw new BadRequestException('El vehículo seleccionado no pertenece al cliente');

    if (appointmentId) {
      const appointment = await this.serviceOrdersRepository.findUsableAppointmentById(appointmentId);
      if (!appointment) throw new NotFoundException('Cita no encontrada, eliminada o cancelada');
      if (appointment.customerId !== customerId || appointment.vehicleId !== vehicleId) {
        throw new BadRequestException('La cita seleccionada no corresponde al mismo cliente y vehículo');
      }
    }

    if (assignedAdvisorId) await this.ensureUserExists(assignedAdvisorId, 'Asesor asignado no encontrado o inactivo');
    if (assignedMechanicId) await this.ensureUserExists(assignedMechanicId, 'Mecánico asignado no encontrado o inactivo');
  }

  private async ensureCustomerCanReceiveOrder(customerId: string): Promise<void> {
    const customer = await this.serviceOrdersRepository.findActiveCustomerById(customerId);
    if (!customer) throw new NotFoundException('Cliente no encontrado o inactivo');
  }

  private async ensureVehicleCanReceiveOrder(vehicleId: string): Promise<{ id: string; customerId: string }> {
    const vehicle = await this.serviceOrdersRepository.findActiveVehicleById(vehicleId);
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado o inactivo');
    return vehicle;
  }

  private async ensureUserExists(userId: string, message: string): Promise<void> {
    const user = await this.serviceOrdersRepository.findActiveUserById(userId);
    if (!user) throw new NotFoundException(message);
  }

  private ensureEditable(serviceOrder: ServiceOrderResponse): void {
    const lockedStatuses: ServiceOrderStatus[] = [ServiceOrderStatus.DELIVERED, ServiceOrderStatus.CANCELLED];
    if (lockedStatuses.includes(serviceOrder.status)) {
      throw new BadRequestException('No se puede editar una orden entregada o cancelada');
    }
  }

  private ensureStatusTransitionIsAllowed(currentStatus: ServiceOrderStatus, dto: ChangeServiceOrderStatusDto): void {
    if (dto.status === ServiceOrderStatus.CANCELLED && !dto.cancellationReason?.trim()) {
      throw new BadRequestException('El motivo de cancelación es obligatorio');
    }

    if (!allowedTransitions[currentStatus].includes(dto.status)) {
      throw new BadRequestException('Transición de estado no permitida para la orden de servicio');
    }
  }

  private toCreateData(dto: CreateServiceOrderDto): Omit<
    Prisma.ServiceOrderCreateInput,
    'orderNumber' | 'customer' | 'vehicle' | 'appointment' | 'assignedAdvisor' | 'assignedMechanic' | 'createdBy'
  > {
    return {
      reportedMileage: dto.reportedMileage,
      fuelLevel: dto.fuelLevel,
      customerRequest: dto.customerRequest.trim(),
      initialDiagnosis: normalizeOptional(dto.initialDiagnosis),
      internalNotes: normalizeOptional(dto.internalNotes),
      estimatedDeliveryAt: dto.estimatedDeliveryAt
    };
  }

  private toUpdateData(dto: UpdateServiceOrderDto): Omit<
    Prisma.ServiceOrderUpdateInput,
    'customer' | 'vehicle' | 'appointment' | 'assignedAdvisor' | 'assignedMechanic' | 'updatedBy'
  > {
    return {
      reportedMileage: dto.reportedMileage,
      fuelLevel: dto.fuelLevel,
      customerRequest: dto.customerRequest?.trim(),
      initialDiagnosis: normalizeOptional(dto.initialDiagnosis),
      internalNotes: normalizeOptional(dto.internalNotes),
      estimatedDeliveryAt: dto.estimatedDeliveryAt
    };
  }

  private async audit(
    action: string,
    serviceOrder: ServiceOrderResponse,
    actorId?: string,
    oldValues?: ServiceOrderResponse,
    newValues?: ServiceOrderResponse
  ): Promise<void> {
    await this.auditService.log({
      userId: actorId,
      action,
      module: 'service-orders',
      entity: 'ServiceOrder',
      entityId: serviceOrder.id,
      oldValues,
      newValues
    });
  }
}

function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function getUpdateAuditAction(oldServiceOrder: ServiceOrderResponse, serviceOrder: ServiceOrderResponse): string {
  if (oldServiceOrder.assignedMechanicId !== serviceOrder.assignedMechanicId) return 'assign-mechanic';
  if (oldServiceOrder.assignedAdvisorId !== serviceOrder.assignedAdvisorId) return 'assign-advisor';
  return 'update';
}
