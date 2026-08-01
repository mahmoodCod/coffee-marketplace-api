/**
 * ------------------------------------------------------------------------
 * Auth Service Mock
 * ------------------------------------------------------------------------
 *
 * Mock implementation for AuthService.
 * Used by AuthController unit tests.
 * ------------------------------------------------------------------------
 */

export const authServiceMock = {
  register: jest.fn(),

  login: jest.fn(),

  verifyOtp: jest.fn(),

  refreshToken: jest.fn(),

  logout: jest.fn(),
};
