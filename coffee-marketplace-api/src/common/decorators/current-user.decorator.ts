import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

/**
 * Custom decorator to extract the authenticated user
 * from the request object.
 *
 * The user object is attached by JwtStrategy
 * after successful authentication.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>();

    return request.user;
  },
);
