import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from '../src/modules/permissions/guards/permissions.guard';

describe('Service orders permissions', () => {
  it('blocks access without service order permission', () => {
    const reflector = { getAllAndOverride: jest.fn(() => ['service-orders.read']) } as unknown as Reflector;
    const guard = new PermissionsGuard(reflector);
    const context = {
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
      switchToHttp: () => ({ getRequest: () => ({ user: { permissions: ['customers.read'] } }) })
    };

    expect(() => guard.canActivate(context as never)).toThrow(ForbiddenException);
  });
});
