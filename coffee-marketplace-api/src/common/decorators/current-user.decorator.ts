import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

/**
 * Custom decorator to extract the authenticated user
 * or a specific property from the JWT payload.
 *
 * Examples:
 *   @CurrentUser()
 *   @CurrentUser('sub')
 *   @CurrentUser('phone')
 *   @CurrentUser('role')
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user: JwtPayload }>();

    if (!request.user) {
      throw new UnauthorizedException('Authenticated user not found.');
    }

    return data ? request.user[data] : request.user;
  },
);
