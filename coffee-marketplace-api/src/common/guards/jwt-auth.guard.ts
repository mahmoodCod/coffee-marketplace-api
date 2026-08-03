import { ExecutionContext, Injectable } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { AuthGuard } from '@nestjs/passport';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * ------------------------------------------------------------------------
 * JWT Authentication Guard
 * ------------------------------------------------------------------------
 *
 * Protects endpoints that require authentication.
 *
 * Behaviour:
 *
 * - Public endpoints bypass JWT authentication.
 * - Protected endpoints require a valid JWT access token.
 *
 * Example:
 *
 * @Public()
 * POST /auth/login
 *
 * @UseGuards(JwtAuthGuard)
 * GET /users/profile
 * ------------------------------------------------------------------------
 */

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    /**
     * Skip authentication
     * for public endpoints.
     */
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
