import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

/**
 * ------------------------------------------------------------------------
 * Optional Current User Decorator
 * ------------------------------------------------------------------------
 *
 * Extracts the authenticated user from the request.
 *
 * Returns:
 * - JwtPayload when the request is authenticated.
 * - null when the request is made by a guest.
 *
 * This decorator should be used with @OptionalAuth().
 * ------------------------------------------------------------------------
 */

export const OptionalCurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload | null => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();

    return request.user ?? null;
  },
);
