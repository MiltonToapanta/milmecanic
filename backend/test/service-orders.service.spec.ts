import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FuelLevel, ServiceOrderStatus } from '@prisma/client';
import { ServiceOrdersService } from '../src/modules/service-orders/services/service-orders.service';

const customer = { id: 'customer-id', isActive: true, deletedAt: null };
const vehicle = { id: 'vehicle-id', customerId: 'customer-id', isActive: true, deletedAt: null };
const otherVehicle = { id: 'other-vehicle-id', customerId: 'other-customer-id', isActive: true, deletedAt: null };
const appointment = { id: 'appointment-id', customerId: 'customer-id', vehicleId: 'vehicle-id', status: 'CONFIRMED', deletedAt: null };
const otherVehicleAppointment = { id: 'appointment-id', customerId: 'customer-id', vehicleId: 'other-vehicle-id', status: 'CONFIRMED', deletedAt: null };
const user = { id: 'user-id', isActive: true, deletedAt: null };

const serviceOrder = {
  id: 'service-order-id',
  orderNumber: 'OT-000001',
  customerId: 'customer-id',
  vehicleId: 'vehicle-id',
  appointmentId: null,
  assignedAdvisorId: 'advisor-id',
  assignedMechanicId: null,
  status: ServiceOrderStatus.RECEIVED,
  reportedMileage: 100,
  fuelLevel: FuelLevel.HALF,
  customerRequest: 'Revisión general del vehículo',
  initialDiagnosis: null,
  internalNotes: null,
  estimatedDeliveryAt: null,
  startedAt: null,
  completedAt: null,
  deliveredAt: null,
  cancellationReason: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  customer: {
    id: 'customer-id',
    displayName: 'Carlos Mora',
    identification: '0102030405'
  },
  vehicle: {
    id: 'vehicle-id',
    plate: 'ABC123',
    displayName: 'Toyota Corolla'
  },
  appointment: null,
  assignedAdvisor: {
    id: 'advisor-id',
    displayName: 'Sofía Andrade'
  },
  assignedMechanic: null
};

describe('ServiceOrdersService', () => {
  const repository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findActiveCustomerById: jest.fn(),
    findActiveVehicleById: jest.fn(),
    findActiveUserById: jest.fn(),
    findUsableAppointmentById: jest.fn(),
    getServiceOrderPrefix: jest.fn(),
    createTransactional: jest.fn(),
    update: jest.fn()
  };
  const audit = { log: jest.fn() };
  let service: ServiceOrdersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ServiceOrdersService(repository as never, audit as never);
  });

  it('creates a service order correctly', async () => {
    mockValidRelations();
    repository.getServiceOrderPrefix.mockResolvedValue('OT');
    repository.createTransactional.mockResolvedValue(serviceOrder);

    const result = await service.create(
      {
        customerId: 'customer-id',
        vehicleId: 'vehicle-id',
        assignedAdvisorId: 'advisor-id',
        reportedMileage: 100,
        fuelLevel: FuelLevel.HALF,
        customerRequest: 'Revisión general del vehículo'
      },
      'actor-id'
    );

    expect(result.id).toBe('service-order-id');
    expect(repository.createTransactional).toHaveBeenCalledWith(expect.objectContaining({ prefix: 'OT' }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'create', module: 'service-orders' }));
  });

  it('generates an automatic order number through repository transaction', async () => {
    mockValidRelations();
    repository.getServiceOrderPrefix.mockResolvedValue('OT');
    repository.createTransactional.mockResolvedValue(serviceOrder);

    const result = await service.create({
      customerId: 'customer-id',
      vehicleId: 'vehicle-id',
      reportedMileage: 100,
      fuelLevel: FuelLevel.HALF,
      customerRequest: 'Revisión general del vehículo'
    });

    expect(result.orderNumber).toBe('OT-000001');
  });

  it('rejects missing customer', async () => {
    repository.findActiveCustomerById.mockResolvedValue(null);

    await expect(
      service.create({
        customerId: 'missing-customer',
        vehicleId: 'vehicle-id',
        reportedMileage: 100,
        fuelLevel: FuelLevel.HALF,
        customerRequest: 'Revisión general del vehículo'
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects missing vehicle', async () => {
    repository.findActiveCustomerById.mockResolvedValue(customer);
    repository.findActiveVehicleById.mockResolvedValue(null);

    await expect(
      service.create({
        customerId: 'customer-id',
        vehicleId: 'missing-vehicle',
        reportedMileage: 100,
        fuelLevel: FuelLevel.HALF,
        customerRequest: 'Revisión general del vehículo'
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects vehicle that does not belong to the customer', async () => {
    repository.findActiveCustomerById.mockResolvedValue(customer);
    repository.findActiveVehicleById.mockResolvedValue(otherVehicle);

    await expect(
      service.create({
        customerId: 'customer-id',
        vehicleId: 'other-vehicle-id',
        reportedMileage: 100,
        fuelLevel: FuelLevel.HALF,
        customerRequest: 'Revisión general del vehículo'
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects appointment from another vehicle', async () => {
    repository.findActiveCustomerById.mockResolvedValue(customer);
    repository.findActiveVehicleById.mockResolvedValue(vehicle);
    repository.findUsableAppointmentById.mockResolvedValue(otherVehicleAppointment);

    await expect(
      service.create({
        customerId: 'customer-id',
        vehicleId: 'vehicle-id',
        appointmentId: 'appointment-id',
        reportedMileage: 100,
        fuelLevel: FuelLevel.HALF,
        customerRequest: 'Revisión general del vehículo'
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists service orders', async () => {
    const paginated = { items: [serviceOrder], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    repository.findAll.mockResolvedValue(paginated);
    await expect(service.findAll({ page: 1, limit: 10 })).resolves.toEqual(paginated);
  });

  it('searches by order number', async () => {
    const paginated = { items: [serviceOrder], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    repository.findAll.mockResolvedValue(paginated);
    await service.findAll({ page: 1, limit: 10, search: 'OT-000001' });
    expect(repository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10, search: 'OT-000001' });
  });

  it('filters by status', async () => {
    const paginated = { items: [serviceOrder], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    repository.findAll.mockResolvedValue(paginated);
    await service.findAll({ page: 1, limit: 10, status: ServiceOrderStatus.RECEIVED });
    expect(repository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10, status: ServiceOrderStatus.RECEIVED });
  });

  it('updates a service order', async () => {
    repository.findById.mockResolvedValue(serviceOrder);
    mockValidRelations();
    repository.update.mockResolvedValue({ ...serviceOrder, internalNotes: 'Prioridad media' });

    const result = await service.update('service-order-id', { internalNotes: 'Prioridad media' }, 'actor-id');
    expect(result.internalNotes).toBe('Prioridad media');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
  });

  it('assigns a mechanic', async () => {
    repository.findById.mockResolvedValue(serviceOrder);
    mockValidRelations();
    repository.findActiveUserById.mockResolvedValue(user);
    repository.update.mockResolvedValue({ ...serviceOrder, assignedMechanicId: 'mechanic-id' });

    await service.update('service-order-id', { assignedMechanicId: 'mechanic-id' }, 'actor-id');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'assign-mechanic' }));
  });

  it('performs a valid status transition', async () => {
    repository.findById.mockResolvedValue(serviceOrder);
    repository.update.mockResolvedValue({ ...serviceOrder, status: ServiceOrderStatus.DIAGNOSIS });

    const result = await service.changeStatus('service-order-id', { status: ServiceOrderStatus.DIAGNOSIS }, 'actor-id');
    expect(result.status).toBe(ServiceOrderStatus.DIAGNOSIS);
  });

  it('rejects status jumps', async () => {
    repository.findById.mockResolvedValue(serviceOrder);

    await expect(service.changeStatus('service-order-id', { status: ServiceOrderStatus.IN_REPAIR })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects status rollback', async () => {
    repository.findById.mockResolvedValue({ ...serviceOrder, status: ServiceOrderStatus.IN_REPAIR });

    await expect(service.changeStatus('service-order-id', { status: ServiceOrderStatus.DIAGNOSIS })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cancels with reason', async () => {
    repository.findById.mockResolvedValue(serviceOrder);
    repository.update.mockResolvedValue({ ...serviceOrder, status: ServiceOrderStatus.CANCELLED, cancellationReason: 'Cliente no autoriza' });

    const result = await service.changeStatus(
      'service-order-id',
      { status: ServiceOrderStatus.CANCELLED, cancellationReason: 'Cliente no autoriza' },
      'actor-id'
    );
    expect(result.status).toBe(ServiceOrderStatus.CANCELLED);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'cancel' }));
  });

  it('rejects cancellation without reason', async () => {
    repository.findById.mockResolvedValue(serviceOrder);

    await expect(service.changeStatus('service-order-id', { status: ServiceOrderStatus.CANCELLED })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('blocks editing a delivered service order', async () => {
    repository.findById.mockResolvedValue({ ...serviceOrder, status: ServiceOrderStatus.DELIVERED });

    await expect(service.update('service-order-id', { internalNotes: 'No editar' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('soft deletes a service order', async () => {
    repository.findById.mockResolvedValue(serviceOrder);
    repository.update.mockResolvedValue({ ...serviceOrder, deletedAt: new Date(), isActive: false });

    await service.softDelete('service-order-id', 'actor-id');
    const updateCalls = repository.update.mock.calls as Array<[string, { deletedAt?: Date }]>;
    expect(updateCalls[0][1].deletedAt).toBeInstanceOf(Date);
  });

  function mockValidRelations(): void {
    repository.findActiveCustomerById.mockResolvedValue(customer);
    repository.findActiveVehicleById.mockResolvedValue(vehicle);
    repository.findUsableAppointmentById.mockResolvedValue(appointment);
    repository.findActiveUserById.mockResolvedValue(user);
  }
});
