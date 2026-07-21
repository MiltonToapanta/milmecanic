import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../src/modules/permissions/guards/permissions.guard';

describe('PermissionsGuard', () => {
  it('rejects insufficient permissions', () => {
    const reflector = { getAllAndOverride: jest.fn(() => ['users.create']) } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    const context = {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { permissions: ['users.read'] } }) })
    };

    expect(() => guard.canActivate(context as never)).toThrow(ForbiddenException);
  });
});
