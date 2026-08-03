import { SetMetadata } from '@nestjs/common';

import { SystemRole } from '../constants/system-roles.constant';

/**
 * ------------------------------------------------------------------------
 * Roles Decorator
 * ------------------------------------------------------------------------
 *
 * Declares which system roles
 * can access an endpoint.
 *
 * Example:
 *
 * @Roles(SYSTEM_ROLES.ADMIN)
 *
 * @Roles(
 *    SYSTEM_ROLES.ADMIN,
 *    SYSTEM_ROLES.SELLER,
 * )
 * ------------------------------------------------------------------------
 */

export const ROLES_KEY = 'roles';

export const Roles = (...roles: SystemRole[]) => SetMetadata(ROLES_KEY, roles);
