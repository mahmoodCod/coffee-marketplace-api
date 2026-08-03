import 'reflect-metadata';

import { ROLES_KEY, Roles } from './roles.decorator';

import { SYSTEM_ROLES } from '../constants/system-roles.constant';

/**
 * ------------------------------------------------------------------------
 * Roles Decorator Unit Tests
 * ------------------------------------------------------------------------
 *
 * Responsibilities:
 * - Verify metadata is attached correctly.
 * ------------------------------------------------------------------------
 */

describe('Roles Decorator', () => {
  /**
   * Fake controller used only for metadata testing.
   */
  class TestController {
    @Roles(SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SELLER)
    handler() {}
  }

  /**
   * ------------------------------------------------------------------------
   * Metadata
   * ------------------------------------------------------------------------
   */
  it('should attach roles metadata', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      TestController.prototype.handler,
    );

    expect(roles).toEqual([SYSTEM_ROLES.ADMIN, SYSTEM_ROLES.SELLER]);
  });
});
