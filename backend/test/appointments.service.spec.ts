import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentStatus } from '@prisma/client';
import { AppointmentsService } from '../src/modules/appointments/services/appointments.service';

const customer = { id: 'customer-id', isActive: true, deletedAt: null };
const vehicle = { id: 'vehicle-id', customerId: 'customer-id', isActive: true, deletedAt: null };
const otherVehicle = { id: 'other-vehicle-id', customerId: 'other-customer-id', isActive: true, deletedAt: null };
const assignedUser = { id: 'advisor-id', isActive: true, deletedAt: null };

const appointment = {
  id: 'appointment-id',
  customerId: 'customer-id',
  vehicleId: 'vehicle-id',
  assignedUserId: null,
  scheduledAt: new Date('2026-07-21T14:00:00.000Z'),
  estimatedDurationMinutes: 60,
  reason: 'Cambio de aceite',
  notes: null,
  status: AppointmentStatus.SCHEDULED,
  cancellationReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: null,
  updatedBy: null,
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
  assignedUser: null
};

describe('AppointmentsService', () => {
  const repository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findActiveCustomerById: jest.fn(),
    findActiveVehicleById: jest.fn(),
    findActiveUserById: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  };
  const audit = { log: jest.fn() };
  let service: AppointmentsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AppointmentsService(repository as never, audit as never);
  });

  it('creates an appointment correctly', async () => {
    repository.findActiveCustomerById.mockResolvedValue(customer);
    repository.findActiveVehicleById.mockResolvedValue(vehicle);
    repository.findActiveUserById.mockResolvedValue(assignedUser);
    repository.create.mockResolvedValue({ ...appointment, assignedUserId: 'advisor-id' });

    const result = await service.create(
      {
        customerId: 'customer-id',
        vehicleId: 'vehicle-id',
        assignedUserId: 'advisor-id',
        scheduledAt: new Date('2026-07-21T14:00:00.000Z'),
        estimatedDurationMinutes: 60,
        reason: 'Cambio de aceite'
      },
      'actor-id'
    );

    expect(result.id).toBe('appointment-id');
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ estimatedDurationMinutes: 60 }));
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'create', module: 'appointments' }));
  });

  it('rejects missing customer', async () => {
    repository.findActiveCustomerById.mockResolvedValue(null);

    await expect(
      service.create({
        customerId: 'missing-customer',
        vehicleId: 'vehicle-id',
        scheduledAt: new Date(),
        estimatedDurationMinutes: 60,
        reason: 'Mantenimiento'
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
        scheduledAt: new Date(),
        estimatedDurationMinutes: 60,
        reason: 'Mantenimiento'
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
        scheduledAt: new Date(),
        estimatedDurationMinutes: 60,
        reason: 'Mantenimiento'
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('lists appointments with pagination', async () => {
    const paginated = { items: [appointment], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    repository.findAll.mockResolvedValue(paginated);
    await expect(service.findAll({ page: 1, limit: 10 })).resolves.toEqual(paginated);
  });

  it('filters by date', async () => {
    const paginated = { items: [appointment], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    repository.findAll.mockResolvedValue(paginated);
    const dateFrom = new Date('2026-07-21T00:00:00.000Z');
    const dateTo = new Date('2026-07-21T23:59:59.999Z');
    await service.findAll({ page: 1, limit: 10, dateFrom, dateTo });
    expect(repository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10, dateFrom, dateTo });
  });

  it('filters by status', async () => {
    const paginated = { items: [appointment], pagination: { page: 1, limit: 10, total: 1, totalPages: 1 } };
    repository.findAll.mockResolvedValue(paginated);
    await service.findAll({ page: 1, limit: 10, status: AppointmentStatus.SCHEDULED });
    expect(repository.findAll).toHaveBeenCalledWith({ page: 1, limit: 10, status: AppointmentStatus.SCHEDULED });
  });

  it('updates an appointment', async () => {
    repository.findById.mockResolvedValue(appointment);
    repository.findActiveCustomerById.mockResolvedValue(customer);
    repository.findActiveVehicleById.mockResolvedValue(vehicle);
    repository.update.mockResolvedValue({ ...appointment, reason: 'Alineación' });

    const result = await service.update('appointment-id', { reason: 'Alineación' }, 'actor-id');
    expect(result.reason).toBe('Alineación');
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'update' }));
  });

  it('confirms an appointment', async () => {
    repository.findById.mockResolvedValue(appointment);
    repository.update.mockResolvedValue({ ...appointment, status: AppointmentStatus.CONFIRMED });

    const result = await service.changeStatus('appointment-id', { status: AppointmentStatus.CONFIRMED }, 'actor-id');
    expect(result.status).toBe(AppointmentStatus.CONFIRMED);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'change-status' }));
  });

  it('cancels an appointment with reason', async () => {
    repository.findById.mockResolvedValue(appointment);
    repository.update.mockResolvedValue({ ...appointment, status: AppointmentStatus.CANCELLED, cancellationReason: 'Cliente reprograma' });

    const result = await service.changeStatus(
      'appointment-id',
      { status: AppointmentStatus.CANCELLED, cancellationReason: 'Cliente reprograma' },
      'actor-id'
    );
    expect(result.status).toBe(AppointmentStatus.CANCELLED);
    expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'cancel' }));
  });

  it('rejects cancellation without reason', async () => {
    repository.findById.mockResolvedValue(appointment);

    await expect(service.changeStatus('appointment-id', { status: AppointmentStatus.CANCELLED })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('completes an appointment', async () => {
    repository.findById.mockResolvedValue({ ...appointment, status: AppointmentStatus.IN_PROGRESS });
    repository.update.mockResolvedValue({ ...appointment, status: AppointmentStatus.COMPLETED });

    const result = await service.changeStatus('appointment-id', { status: AppointmentStatus.COMPLETED });
    expect(result.status).toBe(AppointmentStatus.COMPLETED);
  });

  it('rejects completed appointment back to scheduled', async () => {
    repository.findById.mockResolvedValue({ ...appointment, status: AppointmentStatus.COMPLETED });

    await expect(service.changeStatus('appointment-id', { status: AppointmentStatus.SCHEDULED })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects cancelled appointment directly to completed', async () => {
    repository.findById.mockResolvedValue({ ...appointment, status: AppointmentStatus.CANCELLED });

    await expect(service.changeStatus('appointment-id', { status: AppointmentStatus.COMPLETED })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('soft deletes an appointment', async () => {
    repository.findById.mockResolvedValue(appointment);
    repository.update.mockResolvedValue({ ...appointment, deletedAt: new Date() });

    await service.softDelete('appointment-id', 'actor-id');
    const updateCalls = repository.update.mock.calls as Array<[string, { deletedAt?: Date }]>;
    expect(updateCalls[0][1].deletedAt).toBeInstanceOf(Date);
  });
});
