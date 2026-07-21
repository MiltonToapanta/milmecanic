import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../src/modules/permissions/guards/permissions.guard';

describe('Customers permissions', () => {
  it('blocks access without customer permission', () => {
    const reflector = { getAllAndOverride: jest.fn(() => ['customers.read']) } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    const context = {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { permissions: ['users.read'] } }) })
    };

    expect(() => guard.canActivate(context as never)).toThrow(ForbiddenException);
  });
});
