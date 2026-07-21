import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CustomerType, Prisma } from '@prisma/client';
import { AuditService } from '../../audit/services/audit.service';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { CustomerQueryDto } from '../dto/customer-query.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { CustomersRepository } from '../repositories/customers.repository';

@Injectable()
export class CustomersService {
  constructor(
    private readonly customersRepository: CustomersRepository,
    private readonly auditService: AuditService
  ) {}

  findAll(query: CustomerQueryDto) {
    return this.customersRepository.findAll(query);
  }

  async findById(id: string) {
    const customer = await this.customersRepository.findById(id);
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer;
  }

  async create(dto: CreateCustomerDto, actorId?: string) {
    this.validateCustomerShape(dto);
    await this.ensureIdentificationIsUnique(dto.identification);
    const customer = await this.customersRepository.create({
      ...this.toCreateData(dto),
      createdBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.auditService.log({
      userId: actorId,
      action: 'create',
      module: 'customers',
      entity: 'Customer',
      entityId: customer.id,
      newValues: customer
    });
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, actorId?: string) {
    const oldCustomer = await this.findById(id);
    const merged = { ...oldCustomer, ...dto };
    this.validateCustomerShape(merged);
    if (dto.identification) await this.ensureIdentificationIsUnique(dto.identification, id);

    const customer = await this.customersRepository.update(id, {
      ...this.toUpdateData(dto),
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.auditService.log({
      userId: actorId,
      action: 'update',
      module: 'customers',
      entity: 'Customer',
      entityId: id,
      oldValues: oldCustomer,
      newValues: customer
    });
    return customer;
  }

  async activate(id: string, actorId?: string) {
    return this.changeStatus(id, true, actorId, 'activate');
  }

  async deactivate(id: string, actorId?: string) {
    return this.changeStatus(id, false, actorId, 'deactivate');
  }

  async softDelete(id: string, actorId?: string) {
    const oldCustomer = await this.findById(id);
    const customer = await this.customersRepository.update(id, {
      deletedAt: new Date(),
      isActive: false,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.auditService.log({
      userId: actorId,
      action: 'delete',
      module: 'customers',
      entity: 'Customer',
      entityId: id,
      oldValues: oldCustomer,
      newValues: customer
    });
    return customer;
  }

  private async changeStatus(id: string, isActive: boolean, actorId: string | undefined, action: 'activate' | 'deactivate') {
    const oldCustomer = await this.findById(id);
    const customer = await this.customersRepository.update(id, {
      isActive,
      updatedBy: actorId ? { connect: { id: actorId } } : undefined
    });
    await this.auditService.log({
      userId: actorId,
      action,
      module: 'customers',
      entity: 'Customer',
      entityId: id,
      oldValues: oldCustomer,
      newValues: customer
    });
    return customer;
  }

  private async ensureIdentificationIsUnique(identification: string, excludeId?: string): Promise<void> {
    const existing = await this.customersRepository.findByIdentification(identification, excludeId);
    if (existing) throw new ConflictException('Ya existe un cliente activo con esta identificación');
  }

  private validateCustomerShape(customer: {
    customerType: CustomerType;
    firstName?: string | null;
    lastName?: string | null;
    businessName?: string | null;
  }): void {
    if (customer.customerType === CustomerType.PERSON && (!customer.firstName?.trim() || !customer.lastName?.trim())) {
      throw new BadRequestException('Las personas deben tener nombres y apellidos');
    }
    if (customer.customerType === CustomerType.COMPANY && !customer.businessName?.trim()) {
      throw new BadRequestException('Las empresas deben tener razón social');
    }
  }

  private toCreateData(dto: CreateCustomerDto): Prisma.CustomerCreateInput {
    return {
      customerType: dto.customerType,
      identificationType: dto.identificationType,
      identification: dto.identification.trim(),
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
      businessName: dto.businessName?.trim(),
      email: dto.email?.toLowerCase().trim(),
      phone: dto.phone?.trim(),
      secondaryPhone: dto.secondaryPhone?.trim(),
      address: dto.address?.trim(),
      city: dto.city?.trim(),
      notes: dto.notes?.trim()
    };
  }

  private toUpdateData(dto: UpdateCustomerDto): Prisma.CustomerUpdateInput {
    return {
      customerType: dto.customerType,
      identificationType: dto.identificationType,
      identification: dto.identification?.trim(),
      firstName: dto.firstName?.trim(),
      lastName: dto.lastName?.trim(),
      businessName: dto.businessName?.trim(),
      email: dto.email?.toLowerCase().trim(),
      phone: dto.phone?.trim(),
      secondaryPhone: dto.secondaryPhone?.trim(),
      address: dto.address?.trim(),
      city: dto.city?.trim(),
      notes: dto.notes?.trim()
    };
  }
}
