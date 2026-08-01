/**
 * ------------------------------------------------------------------------
 * JWT Token Service Mock
 * ------------------------------------------------------------------------
 *
 * Mock implementation for JwtTokenService.
 * Used by AuthService unit tests.
 * ------------------------------------------------------------------------
 */

export const jwtTokenServiceMock = {
  generateAccessToken: jest.fn(),

  generateRefreshToken: jest.fn(),

  verifyAccessToken: jest.fn(),

  verifyRefreshToken: jest.fn(),

  revokeRefreshToken: jest.fn(),

  decode: jest.fn(),
};
