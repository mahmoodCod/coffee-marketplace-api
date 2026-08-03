import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

import { ROLES_KEY } from '../decorators/roles.decorator';

import { SystemRole } from '../constants/system-roles.constant';

/**
 * ------------------------------------------------------------------------
 * Roles Guard
 * ------------------------------------------------------------------------
 *
 * Checks whether the authenticated user
 * owns one of the required roles.
 *
 * This guard MUST be used after JwtAuthGuard.
 * ------------------------------------------------------------------------
 */

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<SystemRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    /**
     * Endpoint has no role restriction.
     */
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    const user = request.user as JwtPayload;

    if (!user) {
      return false;
    }

    return requiredRoles.includes(user.role as SystemRole);
  }
}
