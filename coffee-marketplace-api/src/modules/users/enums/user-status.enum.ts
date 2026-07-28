/**
 * ------------------------------------------------------------------------
 * User Status
 * ------------------------------------------------------------------------
 *
 * Represents the current state of a user account.
 *
 * ACTIVE
 * The account is operational and can access the platform.
 *
 * BLOCKED
 * The account is temporarily blocked by administrators.
 *
 * SUSPENDED
 * The account is suspended due to policy violations.
 * ------------------------------------------------------------------------
 */

export enum UserStatus {
  ACTIVE = 'active',

  BLOCKED = 'blocked',

  SUSPENDED = 'suspended',
}
