import { FuelType, TransmissionType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateVehicleDto } from '../src/modules/vehicles/dto/create-vehicle.dto';

describe('CreateVehicleDto', () => {
  const valid = {
    customerId: 'f21d67b2-80d1-46d0-9c5d-00a9b6d98507',
    plate: ' abc 123 ',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2024,
    fuelType: FuelType.GASOLINE,
    transmissionType: TransmissionType.MANUAL,
    mileage: 0
  };

  it('normalizes plate to uppercase', async () => {
    const dto = plainToInstance(CreateVehicleDto, valid);
    await validate(dto);
    expect(dto.plate).toBe('ABC123');
  });

  it('rejects negative mileage', async () => {
    const dto = plainToInstance(CreateVehicleDto, { ...valid, mileage: -1 });
    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'mileage')).toBe(true);
  });
});
