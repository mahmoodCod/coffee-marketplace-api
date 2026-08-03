import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * ------------------------------------------------------------------------
 * Roles Guard
 * ------------------------------------------------------------------------
 *
 * Checks whether the authenticated user
 * owns one of the required roles.
 *
 * This guard MUST be used after JwtAuthGuard.
 *
 * Example:
 *
 * @UseGuards(JwtAuthGuard, RolesGuard)
 *
 * @Roles('admin')
 * ------------------------------------------------------------------------
 */

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    /**
     * Endpoint does not require roles.
     */
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user;

    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role);
  }
}
