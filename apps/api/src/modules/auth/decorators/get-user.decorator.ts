import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PublicUser } from '../../../common/utils/user-public';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

export const GetUser = createParamDecorator(
  (data: keyof PublicUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    if (!user) {
      return undefined;
    }
    return data ? user[data] : user;
  },
);
