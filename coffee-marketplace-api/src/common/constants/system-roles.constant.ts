/**
 * ------------------------------------------------------------------------
 * System Roles
 * ------------------------------------------------------------------------
 *
 * Centralized role names.
 *
 * Avoids hardcoded strings across the project.
 *
 * Example:
 *
 * @Roles(SYSTEM_ROLES.ADMIN)
 * ------------------------------------------------------------------------
 */

export const SYSTEM_ROLES = {
  ADMIN: 'admin',

  SELLER: 'seller',

  CUSTOMER: 'customer',
} as const;

/**
 * Union type of every system role.
 */
export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
