import { ConflictException, NotFoundException } from '@nestjs/common';
import { FuelType, TransmissionType } from '@prisma/client';
import { VehiclesService } from '../src/modules/vehicles/services/vehicles.service';

const activePersonCustomer = { id: 'customer-person-id', isActive: true, deletedAt: null };
const activeCompanyCustomer = { id: 'customer-company-id', isActive: true, deletedAt: null };
const deletedCustomer = { id: 'customer-deleted-id', isActive: true, deletedAt: new Date() };

const vehicle = {
  id: 'vehicle-id',
  customerId: 'customer-person-id',
  plate: 'ABC123',
  vin: 'VIN1234567890',
  brand: 'Toyota',
  model: 'Corolla',
  year: 2024,
  color: 'Blanco',
  engineNumber: null,
  chassisNumber: null,
  fuelType: FuelType.GASOLINE,
  transmissionType: TransmissionType.MANUAL,
  mileage: 100,
  notes: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: null,
  updatedBy: null,
  customer: {
    id: 'customer-person-id',
    displayName: 'Carlos Mora',
    identification: '0102030405'
  }
};

const companyVehicle = {
  ...vehicle,
  id: 'company-vehicle-id',
  customerId: 'customer-company-id',
  plate: 'XYZ987',
  vin: 'VIN9876543210',
  customer: {
    id: 'customer-company-id',
    displayName: 'Empresa Demo',
    identification: '1790012345001'
  }
};

describe('VehiclesService', () => {
  const repository = {
    findAll: jest.fn(),
    findByCustomerId: jest.fn(),
    findById: jest.fn(),
    findActiveCustomerById: jest.fn(),
    findCustomerById: jest.fn(),
    findByPlate: jest.fn(),
    findByVin: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  };
  const audit = { log: jest.fn() };
  let service: VehiclesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VehiclesService(repository as never, audit as never);
  });

  it('creates a vehicle for a person', async () => {
    repository.findActiveCustomerById.mockResolvedValue(activePersonCustomer);
    repository.findByPlate.mockResolvedValue(null);
    repository.findByVin.mockResolvedValue(null);
    repository.create.mockResolvedValue(vehicle);

    const result = await service.create({
      customerId: 'customer-person-id',
      plate: 'abc123',
      vin: 'VIN1234567890',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
      fuelType: FuelType.GASOLINE,
      transmissionType: TransmissionType.MANUAL,
      mileage: 100
    }, 'actor-id');

    expect(result.id).toBe('vehicle-id');
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ plate: 'ABC123' }));
  });

  it('creates a vehicle for a company', async () => {
    repository.findActiveCustomerById.mockResolvedValue(activeCompanyCustomer);
    repository.findByPlate.mockResolvedValue(null);
    repository.findByVin.mockResolvedValue(null);
    repository.create.mockResolvedValue(companyVehicle);

    const result = await service.create({
      customerId: 'customer-company-id',
      plate: 'xyz987',
      vin: 'VIN9876543210',
      brand: 'Chevrolet',
      model: 'D-Max',
      year: 2023,
      fuelType: FuelType.DIESEL,
      transmissionType: TransmissionType.MANUAL,
      mileage: 50
    });

    expect(result.customer.displayName).toBe('Empresa Demo');
  });

  it('rejects missing customer', async () => {
    repository.findActiveCustomerById.mockResolvedValue(null);

    await expect(service.create({
      customerId: 'missing-customer',
      plate: 'ABC123',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
      fuelType: FuelType.GASOLINE,
      transmissionType: TransmissionType.MANUAL,
      mileage: 0
    })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects deleted customer', async () => {
    repository.findActiveCustomerById.mockResolvedValue(null);
    repository.findCustomerById.mockResolvedValue(deletedCustomer);

    await expect(service.create({
      customerId: 'customer-deleted-id',
      plate: 'ABC123',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
      fuelType: FuelType.GASOLINE,
      transmissionType: TransmissionType.MANUAL,
      mileage: 0
    })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects duplicate plate', async () => {
    repository.findActiveCustomerById.mockResolvedValue(activePersonCustomer);
    repository.findByPlate.mockResolvedValue(vehicle);

    await expect(service.create({
      customerId: 'customer-person-id',
      plate: 'ABC123',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
      fuelType: FuelType.GASOLINE,
      transmissionType: TransmissionType.MANUAL,
      mileage: 0
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects duplicate VIN', async () => {
    repository.findActiveCustomerById.mockResolvedValue(activePersonCustomer);
    repository.findByPlate.mockResolvedValue(null);
    repository.findByVin.mockResolvedValue(vehicle);

    await expect(service.create({
      customerId: 'customer-person-id',
      plate: 'NEW123',
      vin: 'VIN1234567890',
      brand: 'Toyota',
      model: 'Corolla',
      year: 2024,
      fuelType: FuelType.GASOLINE,
      transmissionType: TransmissionType.MANUAL,
      mileage: 0
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('lists vehicles with pagination', async () => {
    const paginated = { items: [vehicle], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    repository.findAll.mockResolvedValue(paginated);
    await expect(service.findAll({ page: 1, limit: 10 })).resolves.toEqual(paginated);
  });

  it('searches by plate', async () => {
    const paginated = { items: [vehicle], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    repository.findAll.mockResolvedValue(paginated);
    const result = await service.findAll({ page: 1, limit: 10, search: 'ABC123' });
    expect(result.items[0].plate).toBe('ABC123');
  });

  it('searches by customer', async () => {
    const paginated = { items: [vehicle], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    repository.findAll.mockResolvedValue(paginated);
    const result = await service.findAll({ page: 1, limit: 10, search: 'Carlos' });
    expect(result.items[0].customer.displayName).toBe('Carlos Mora');
  });

  it('updates a vehicle', async () => {
    repository.findById.mockResolvedValue(vehicle);
    repository.update.mockResolvedValue({ ...vehicle, model: 'Yaris' });
    const result = await service.update('vehicle-id', { model: 'Yaris' }, 'actor-id');
    expect(result.model).toBe('Yaris');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
  });

  it('deactivates a vehicle', async () => {
    repository.findById.mockResolvedValue(vehicle);
    repository.update.mockResolvedValue({ ...vehicle, isActive: false });
    const result = await service.deactivate('vehicle-id', 'actor-id');
    expect(result.isActive).toBe(false);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'deactivate' }));
  });

  it('soft deletes a vehicle', async () => {
    repository.findById.mockResolvedValue(vehicle);
    repository.update.mockResolvedValue({ ...vehicle, isActive: false });
    const result = await service.softDelete('vehicle-id', 'actor-id');
    const updateCalls = repository.update.mock.calls as Array<[string, { deletedAt?: Date }]>;
    expect(result.isActive).toBe(false);
    expect(updateCalls[0][1].deletedAt).toBeInstanceOf(Date);
  });

  it('lists vehicles by customer', async () => {
    const paginated = { items: [vehicle], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    repository.findCustomerById.mockResolvedValue(activePersonCustomer);
    repository.findByCustomerId.mockResolvedValue(paginated);
    await expect(service.findByCustomerId('customer-person-id', { page: 1, limit: 10 })).resolves.toEqual(paginated);
  });
});
