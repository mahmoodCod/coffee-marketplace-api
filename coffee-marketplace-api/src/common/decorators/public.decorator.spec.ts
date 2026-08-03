import 'reflect-metadata';

import { IS_PUBLIC_KEY, Public } from './public.decorator';

/**
 * ------------------------------------------------------------------------
 * Public Decorator Unit Tests
 * ------------------------------------------------------------------------
 *
 * Responsibilities:
 * - Verify public metadata is attached correctly.
 * ------------------------------------------------------------------------
 */

describe('Public Decorator', () => {
  /**
   * Fake controller used only for metadata testing.
   */
  class TestController {
    @Public()
    handler() {}
  }

  /**
   * ------------------------------------------------------------------------
   * Metadata
   * ------------------------------------------------------------------------
   */
  it('should attach public metadata', () => {
    const isPublic = Reflect.getMetadata(
      IS_PUBLIC_KEY,
      TestController.prototype.handler,
    );

    expect(isPublic).toBe(true);
  });
});
