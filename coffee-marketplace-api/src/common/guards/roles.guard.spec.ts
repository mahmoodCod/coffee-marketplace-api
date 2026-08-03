import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';

/**
 * ------------------------------------------------------------------------
 * Roles Guard Unit Tests
 * ------------------------------------------------------------------------
 *
 * Responsibilities:
 * - Allow endpoints without role restrictions
 * - Allow users with correct role
 * - Reject users with incorrect role
 * - Reject requests without authenticated user
 * ------------------------------------------------------------------------
 */

describe('RolesGuard', () => {
  let guard: RolesGuard;

  /**
   * Mock Reflector
   */
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(() => {
    guard = new RolesGuard(reflector as unknown as Reflector);

    jest.clearAllMocks();
  });

  /**
   * Creates a fake execution context.
   */
  function createExecutionContext(user?: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),

      getHandler: jest.fn(),

      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  }

  /**
   * ------------------------------------------------------------------------
   * Guard Definition
   * ------------------------------------------------------------------------
   */
  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  /**
   * ------------------------------------------------------------------------
   * No Roles Required
   * ------------------------------------------------------------------------
   *
   * Endpoints without @Roles()
   * should always be accessible.
   */
  it('should allow endpoint without required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    const context = createExecutionContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  /**
   * ------------------------------------------------------------------------
   * Valid Role
   * ------------------------------------------------------------------------
   *
   * User owns one of the required roles.
   */
  it('should allow user with valid role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);

    const context = createExecutionContext({
      role: 'admin',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  /**
   * ------------------------------------------------------------------------
   * Invalid Role
   * ------------------------------------------------------------------------
   *
   * User role does not match.
   */
  it('should reject user with invalid role', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);

    const context = createExecutionContext({
      role: 'customer',
    });

    expect(guard.canActivate(context)).toBe(false);
  });

  /**
   * ------------------------------------------------------------------------
   * Missing User
   * ------------------------------------------------------------------------
   *
   * Request has no authenticated user.
   */
  it('should reject request without user', () => {
    reflector.getAllAndOverride.mockReturnValue(['admin']);

    const context = createExecutionContext();

    expect(guard.canActivate(context)).toBe(false);
  });
});
