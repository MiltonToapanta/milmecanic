import { BadRequestException, ConflictException } from '@nestjs/common';
import { CustomerType, IdentificationType } from '@prisma/client';
import { CustomersService } from '../src/modules/customers/services/customers.service';

const personCustomer = {
  id: 'customer-person-id',
  customerType: CustomerType.PERSON,
  identificationType: IdentificationType.CEDULA,
  identification: '0102030405',
  firstName: 'Carlos',
  lastName: 'Mora',
  businessName: null,
  email: 'carlos@milmecanic.local',
  phone: '0999999999',
  secondaryPhone: null,
  address: null,
  city: null,
  notes: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: null,
  updatedBy: null
};

const companyCustomer = {
  ...personCustomer,
  id: 'customer-company-id',
  customerType: CustomerType.COMPANY,
  identificationType: IdentificationType.RUC,
  identification: '1790012345001',
  firstName: null,
  lastName: null,
  businessName: 'MilMecanic Parts',
  email: 'parts@milmecanic.local'
};

describe('CustomersService', () => {
  const repository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByIdentification: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  };
  const audit = { log: jest.fn() };
  let service: CustomersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CustomersService(repository as never, audit as never);
  });

  it('creates a person', async () => {
    repository.findByIdentification.mockResolvedValue(null);
    repository.create.mockResolvedValue(personCustomer);

    const customer = await service.create({
      customerType: CustomerType.PERSON,
      identificationType: IdentificationType.CEDULA,
      identification: '0102030405',
      firstName: 'Carlos',
      lastName: 'Mora',
      email: 'CARLOS@MILMECANIC.LOCAL',
      phone: '0999999999'
    }, 'actor-id');

    expect(customer.id).toBe('customer-person-id');
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'carlos@milmecanic.local' }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'create', module: 'customers' }));
  });

  it('creates a company', async () => {
    repository.findByIdentification.mockResolvedValue(null);
    repository.create.mockResolvedValue(companyCustomer);

    const customer = await service.create({
      customerType: CustomerType.COMPANY,
      identificationType: IdentificationType.RUC,
      identification: '1790012345001',
      businessName: 'MilMecanic Parts',
      phone: '022222222'
    });

    expect(customer.businessName).toBe('MilMecanic Parts');
  });

  it('rejects duplicate identification', async () => {
    repository.findByIdentification.mockResolvedValue(personCustomer);

    await expect(service.create({
      customerType: CustomerType.PERSON,
      identificationType: IdentificationType.CEDULA,
      identification: '0102030405',
      firstName: 'Carlos',
      lastName: 'Mora',
      phone: '0999999999'
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects person without names', async () => {
    await expect(service.create({
      customerType: CustomerType.PERSON,
      identificationType: IdentificationType.CEDULA,
      identification: '0102030405',
      phone: '0999999999'
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects company without business name', async () => {
    await expect(service.create({
      customerType: CustomerType.COMPANY,
      identificationType: IdentificationType.RUC,
      identification: '1790012345001',
      phone: '022222222'
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists customers with pagination', async () => {
    const paginated = { items: [personCustomer], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    repository.findAll.mockResolvedValue(paginated);

    await expect(service.findAll({ page: 1, limit: 10 })).resolves.toEqual(paginated);
  });

  it('searches customers', async () => {
    const paginated = { items: [companyCustomer], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    repository.findAll.mockResolvedValue(paginated);

    const result = await service.findAll({ page: 1, limit: 10, search: 'Parts' });

    expect(result.items[0].id).toBe('customer-company-id');
    expect(repository.findAll).toHaveBeenCalledWith(expect.objectContaining({ search: 'Parts' }));
  });

  it('updates a customer', async () => {
    repository.findById.mockResolvedValue(personCustomer);
    repository.update.mockResolvedValue({ ...personCustomer, firstName: 'Carla' });

    const customer = await service.update('customer-person-id', { firstName: 'Carla' }, 'actor-id');

    expect(customer.firstName).toBe('Carla');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
  });

  it('deactivates a customer', async () => {
    repository.findById.mockResolvedValue(personCustomer);
    repository.update.mockResolvedValue({ ...personCustomer, isActive: false });

    const customer = await service.deactivate('customer-person-id', 'actor-id');

    expect(customer.isActive).toBe(false);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'deactivate' }));
  });

  it('soft deletes a customer', async () => {
    repository.findById.mockResolvedValue(personCustomer);
    repository.update.mockResolvedValue({ ...personCustomer, isActive: false });

    const customer = await service.softDelete('customer-person-id', 'actor-id');
    const updateCalls = repository.update.mock.calls as Array<[string, { deletedAt?: Date }]>;
    const [, updateData] = updateCalls[0];

    expect(customer.isActive).toBe(false);
    expect(updateData.deletedAt).toBeInstanceOf(Date);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete' }));
  });
});
