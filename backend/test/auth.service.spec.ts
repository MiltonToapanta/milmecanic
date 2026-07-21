import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/modules/auth/services/auth.service';

describe('AuthService', () => {
  const prisma = {
    user: { update: jest.fn() },
    refreshToken: { create: jest.fn(), findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn() }
  };
  const usersService = { findByEmailWithPassword: jest.fn(), findById: jest.fn() };
  const jwtService = { signAsync: jest.fn(), verifyAsync: jest.fn() };
  const configService = { getOrThrow: jest.fn((key: string) => (key.includes('EXPIRES') ? '15m' : 'test-secret-value')) };
  const auditService = { log: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(usersService as never, jwtService as never, configService as never, prisma as never, auditService as never);
  });

  it('logs in with valid credentials', async () => {
    const passwordHash = await bcrypt.hash('Admin123*', 4);
    usersService.findByEmailWithPassword.mockResolvedValue({
      id: 'user-id',
      email: 'admin@milmecanic.local',
      passwordHash,
      isActive: true,
      roleId: 'role-id',
      firstName: 'Administrador',
      lastName: 'General',
      role: { id: 'role-id', name: 'Administrador', rolePermissions: [{ permission: { code: 'users.read' } }] }
    });
    jwtService.signAsync.mockResolvedValueOnce('access-token').mockResolvedValueOnce('refresh-token');
    prisma.refreshToken.create.mockResolvedValue({ id: 'refresh-id' });

    const response = await service.login({ email: 'admin@milmecanic.local', password: 'Admin123*' });

    expect(response.accessToken).toBe('access-token');
    expect(response.user.permissions).toContain('users.read');
  });

  it('rejects invalid credentials', async () => {
    usersService.findByEmailWithPassword.mockResolvedValue(null);
    await expect(service.login({ email: 'bad@milmecanic.local', password: 'Admin123*' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
