import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../src/modules/permissions/guards/permissions.guard';

describe('Vehicles permissions', () => {
  it('blocks access without vehicle permission', () => {
    const reflector = { getAllAndOverride: jest.fn(() => ['vehicles.read']) } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    const context = {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { permissions: ['customers.read'] } }) })
    };

    expect(() => guard.canActivate(context as never)).toThrow(ForbiddenException);
  });
});
