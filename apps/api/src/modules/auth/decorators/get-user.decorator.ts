import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { PublicUser } from '../../../common/utils/user-public';

export const GetUser = createParamDecorator(
  (data: keyof PublicUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: PublicUser }>();
    const user = request.user;
    if (!user) {
      return undefined;
    }
    return data ? user[data] : user;
  },
);
