import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from 'src/common/decorators/public.decorator';
import { IS_OPTIONAL_AUTH_KEY } from 'src/common/decorators/optional-auth.decorator';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  const mockUser: JwtPayload = {
    sub: 'user-uuid-123',
    phone: '989123456789',
    role: 'customer',
    tokenUse: 'access',
  };

  const createGuard = (isPublic = false, isOptionalAuth = false) => {
    reflector = {
      getAllAndOverride: jest.fn((key: string) => {
        if (key === IS_PUBLIC_KEY) return isPublic;
        if (key === IS_OPTIONAL_AUTH_KEY) return isOptionalAuth;

        return undefined;
      }),
    } as unknown as Reflector;

    guard = new JwtAuthGuard(reflector);
  };

  const createContext = (authorization?: string): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          headers: {
            authorization,
          },
        }),
      }),
    } as unknown as ExecutionContext;
  };

  it('should bypass authentication for public endpoints', () => {
    createGuard(true, false);

    const context = createContext();

    expect(guard.canActivate(context)).toBe(true);
  });

  describe('handleRequest', () => {
    it('should allow guests without an authorization header', () => {
      createGuard(false, true);

      const context = createContext();

      const result = guard.handleRequest(
        null,
        null,
        { message: 'No auth token' },
        context,
      );

      expect(result).toBeNull();
    });

    it('should return the authenticated user when the token is valid', () => {
      createGuard(false, true);

      const context = createContext('Bearer valid-token');

      const result = guard.handleRequest(null, mockUser, null, context);

      expect(result).toEqual(mockUser);
    });

    it('should reject invalid tokens on optional endpoints', () => {
      createGuard(false, true);

      const context = createContext('Bearer invalid-token');

      expect(() =>
        guard.handleRequest(null, null, { message: 'jwt malformed' }, context),
      ).toThrow(UnauthorizedException);
    });

    it('should reject expired tokens on optional endpoints', () => {
      createGuard(false, true);

      const context = createContext('Bearer expired-token');

      expect(() =>
        guard.handleRequest(null, null, { message: 'jwt expired' }, context),
      ).toThrow(UnauthorizedException);
    });

    it('should reject requests without tokens on protected endpoints', () => {
      createGuard(false, false);

      const context = createContext();

      expect(() =>
        guard.handleRequest(null, null, { message: 'No auth token' }, context),
      ).toThrow(UnauthorizedException);
    });

    it('should return the authenticated user on protected endpoints', () => {
      createGuard(false, false);

      const context = createContext('Bearer valid-token');

      const result = guard.handleRequest(null, mockUser, null, context);

      expect(result).toEqual(mockUser);
    });

    it('should propagate authentication errors', () => {
      createGuard(false, true);

      const context = createContext();

      const authenticationError = new Error('Authentication failed');

      expect(() =>
        guard.handleRequest(authenticationError, null, null, context),
      ).toThrow(authenticationError);
    });
  });
});
