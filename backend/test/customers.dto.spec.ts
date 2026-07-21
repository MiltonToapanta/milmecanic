import { CustomerType, IdentificationType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCustomerDto } from '../src/modules/customers/dto/create-customer.dto';

describe('CreateCustomerDto', () => {
  it('rejects person without names', async () => {
    const dto = plainToInstance(CreateCustomerDto, {
      customerType: CustomerType.PERSON,
      identificationType: IdentificationType.CEDULA,
      identification: '0102030405',
      phone: '0999999999'
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'firstName')).toBe(true);
    expect(errors.some((error) => error.property === 'lastName')).toBe(true);
  });

  it('rejects company without business name', async () => {
    const dto = plainToInstance(CreateCustomerDto, {
      customerType: CustomerType.COMPANY,
      identificationType: IdentificationType.RUC,
      identification: '1790012345001',
      phone: '022222222'
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'businessName')).toBe(true);
  });
});
