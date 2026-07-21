import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../../audit/services/audit.service';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { VehicleQueryDto } from '../dto/vehicle-query.dto';
import { VehiclesRepository } from '../repositories/vehicles.repository';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly auditService: AuditService
  ) {}

  findAll(query: VehicleQueryDto) {
    return this.vehiclesRepository.findAll(query);
  }

  async findByCustomerId(customerId: string, query: VehicleQueryDto) {
    await this.ensureCustomerExists(customerId);
    return this.vehiclesRepository.findByCustomerId(customerId, query);
  }

  async findById(id: string) {
    const vehicle = await this.vehiclesRepository.findById(id);
    if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
    return vehicle;
  }

  async create(dto: CreateVehicleDto, actorId?: string) {
    await this.ensureCustomerCanOwnVehicle(dto.customerId);
    const plate = normalizePlate(dto.plate);
    const vin = dto.vin ? normalizeOptional(dto.vin) : undefined;
    await this.ensurePlateIsUnique(plate);
    if (vin) await this.ensureVinIsUnique(vin);

    const vehicle = await this.vehiclesRepository.create({
      ...this.toCreateData(dto),
      plate,
      vin,
      customer: { connect: { id: dto.customerId } },
      createdBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.auditService.log({
      userId: actorId,
      action: 'create',
      module: 'vehicles',
      entity: 'Vehicle',
      entityId: vehicle.id,
      newValues: vehicle
    });
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto, actorId?: string) {
    const oldVehicle = await this.findById(id);
    const plate = dto.plate ? normalizePlate(dto.plate) : undefined;
    const vin = dto.vin ? normalizeOptional(dto.vin) : undefined;

    if (dto.customerId && dto.customerId !== oldVehicle.customerId) {
      await this.ensureCustomerCanOwnVehicle(dto.customerId);
    }
    if (plate) await this.ensurePlateIsUnique(plate, id);
    if (vin) await this.ensureVinIsUnique(vin, id);

    const vehicle = await this.vehiclesRepository.update(id, {
      ...this.toUpdateData(dto),
      plate,
      vin,
      customer: dto.customerId ? { connect: { id: dto.customerId } } : undefined,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.auditService.log({
      userId: actorId,
      action: dto.customerId && dto.customerId !== oldVehicle.customerId ? 'change-owner' : 'update',
      module: 'vehicles',
      entity: 'Vehicle',
      entityId: id,
      oldValues: oldVehicle,
      newValues: vehicle
    });
    return vehicle;
  }

  async activate(id: string, actorId?: string) {
    return this.changeStatus(id, true, actorId, 'activate');
  }

  async deactivate(id: string, actorId?: string) {
    return this.changeStatus(id, false, actorId, 'deactivate');
  }

  async softDelete(id: string, actorId?: string) {
    const oldVehicle = await this.findById(id);
    const vehicle = await this.vehiclesRepository.update(id, {
      deletedAt: new Date(),
      isActive: false,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.auditService.log({
      userId: actorId,
      action: 'delete',
      module: 'vehicles',
      entity: 'Vehicle',
      entityId: id,
      oldValues: oldVehicle,
      newValues: vehicle
    });
    return vehicle;
  }

  private async changeStatus(id: string, isActive: boolean, actorId: string | undefined, action: 'activate' | 'deactivate') {
    const oldVehicle = await this.findById(id);
    const vehicle = await this.vehiclesRepository.update(id, {
      isActive,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.auditService.log({
      userId: actorId,
      action,
      module: 'vehicles',
      entity: 'Vehicle',
      entityId: id,
      oldValues: oldVehicle,
      newValues: vehicle
    });
    return vehicle;
  }

  private async ensureCustomerExists(customerId: string): Promise<void> {
    const customer = await this.vehiclesRepository.findCustomerById(customerId);
    if (!customer || customer.deletedAt) throw new NotFoundException('Cliente no encontrado');
  }

  private async ensureCustomerCanOwnVehicle(customerId: string): Promise<void> {
    const customer = await this.vehiclesRepository.findActiveCustomerById(customerId);
    if (!customer) throw new NotFoundException('Cliente no encontrado o inactivo');
  }

  private async ensurePlateIsUnique(plate: string, excludeId?: string): Promise<void> {
    const existing = await this.vehiclesRepository.findByPlate(plate, excludeId);
    if (existing) throw new ConflictException('Ya existe un vehículo activo con esta placa');
  }

  private async ensureVinIsUnique(vin: string, excludeId?: string): Promise<void> {
    const existing = await this.vehiclesRepository.findByVin(vin, excludeId);
    if (existing) throw new ConflictException('Ya existe un vehículo activo con este VIN');
  }

  private toCreateData(dto: CreateVehicleDto): Omit<Prisma.VehicleCreateInput, 'customer' | 'createdBy' | 'plate'> {
    return {
      brand: dto.brand.trim(),
      model: dto.model.trim(),
      year: dto.year,
      color: normalizeOptional(dto.color),
      engineNumber: normalizeOptional(dto.engineNumber),
      chassisNumber: normalizeOptional(dto.chassisNumber),
      fuelType: dto.fuelType,
      transmissionType: dto.transmissionType,
      mileage: dto.mileage,
      notes: normalizeOptional(dto.notes)
    };
  }

  private toUpdateData(dto: UpdateVehicleDto): Omit<Prisma.VehicleUpdateInput, 'customer' | 'updatedBy'> {
    return {
      brand: dto.brand?.trim(),
      model: dto.model?.trim(),
      year: dto.year,
      color: normalizeOptional(dto.color),
      engineNumber: normalizeOptional(dto.engineNumber),
      chassisNumber: normalizeOptional(dto.chassisNumber),
      fuelType: dto.fuelType,
      transmissionType: dto.transmissionType,
      mileage: dto.mileage,
      notes: normalizeOptional(dto.notes)
    };
  }
}

function normalizePlate(plate: string): string {
  return plate.trim().replace(/\s+/gu, '').toUpperCase();
}

function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}
