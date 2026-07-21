import { AppointmentStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ChangeAppointmentStatusDto } from '../src/modules/appointments/dto/change-appointment-status.dto';
import { CreateAppointmentDto } from '../src/modules/appointments/dto/create-appointment.dto';

describe('Appointment DTOs', () => {
  const valid = {
    customerId: 'f21d67b2-80d1-46d0-9c5d-00a9b6d98507',
    vehicleId: 'b7ebf3a1-d232-4fb2-bb0a-99f7fa8927f2',
    scheduledAt: '2026-07-21T14:00:00.000Z',
    estimatedDurationMinutes: 60,
    reason: 'Cambio de aceite'
  };

  it('accepts a valid appointment', async () => {
    const dto = plainToInstance(CreateAppointmentDto, valid);
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid duration', async () => {
    const dto = plainToInstance(CreateAppointmentDto, { ...valid, estimatedDurationMinutes: 0 });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'estimatedDurationMinutes')).toBe(true);
  });

  it('requires cancellation reason when status is cancelled', async () => {
    const dto = plainToInstance(ChangeAppointmentStatusDto, { status: AppointmentStatus.CANCELLED });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'cancellationReason')).toBe(true);
  });
});
