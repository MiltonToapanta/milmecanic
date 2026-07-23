import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

export const CurrentUser = createParamDecorator(<K extends keyof AuthenticatedUser = keyof AuthenticatedUser>(
  data: K | undefined,
  ctx: ExecutionContext
): AuthenticatedUser | AuthenticatedUser[K] => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  if (data) return request.user[data];
  return request.user;
});
