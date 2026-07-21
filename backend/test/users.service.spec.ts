import { ConflictException } from '@nestjs/common';
import { UsersService } from '../src/modules/users/services/users.service';

describe('UsersService', () => {
  const repository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByEmailWithPassword: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  };
  const audit = { log: jest.fn() };
  const service = new UsersService(repository as never, audit as never);

  beforeEach(() => jest.clearAllMocks());

  it('creates a user', async () => {
    repository.findByEmailWithPassword.mockResolvedValue(null);
    repository.create.mockResolvedValue({ id: 'user-id', email: 'new@milmecanic.local' });
    const user = await service.create({ firstName: 'Ana', lastName: 'Ruiz', email: 'new@milmecanic.local', password: 'Admin123*', roleId: 'role-id' }, 'actor-id');
    expect(user.id).toBe('user-id');
  });

  it('rejects duplicate email', async () => {
    repository.findByEmailWithPassword.mockResolvedValue({ id: 'existing' });
    await expect(service.create({ firstName: 'Ana', lastName: 'Ruiz', email: 'new@milmecanic.local', password: 'Admin123*', roleId: 'role-id' })).rejects.toBeInstanceOf(ConflictException);
  });
});
