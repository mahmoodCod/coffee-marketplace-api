import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { IS_OPTIONAL_AUTH_KEY } from 'src/common/decorators/optional-auth.decorator';

/**
 * ------------------------------------------------------------------------
 * JWT Authentication Guard
 * ------------------------------------------------------------------------
 *
 * Protects endpoints that require authentication and supports optional
 * authentication for endpoints accessible to both guests and users.
 *
 * Behaviour:
 *
 * - Public endpoints bypass JWT authentication completely.
 * - Optional endpoints allow requests without an Authorization header.
 * - Optional endpoints authenticate requests with a valid access token.
 * - Invalid tokens are rejected, even on optional endpoints.
 * - Protected endpoints require a valid JWT access token.
 * ------------------------------------------------------------------------
 */

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
  ): TUser {
    const isOptionalAuth = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (err) {
      throw err;
    }

    if (!user) {
      const request = context.switchToHttp().getRequest<{
        headers?: { authorization?: string };
      }>();

      const authorizationHeader = request.headers?.authorization;

      const hasAuthorizationHeader =
        typeof authorizationHeader === 'string' &&
        authorizationHeader.trim().length > 0;

      if (isOptionalAuth && !hasAuthorizationHeader) {
        return null as TUser;
      }

      throw new UnauthorizedException(info?.message || 'Unauthorized.');
    }

    return user;
  }
}
