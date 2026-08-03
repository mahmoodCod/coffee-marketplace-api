import { SetMetadata } from '@nestjs/common';

/**
 * ------------------------------------------------------------------------
 * Roles Decorator
 * ------------------------------------------------------------------------
 *
 * Declares which roles are allowed
 * to access an endpoint.
 *
 * Example:
 *
 * @Roles('admin')
 *
 * @Roles('admin', 'seller')
 * ------------------------------------------------------------------------
 */

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
