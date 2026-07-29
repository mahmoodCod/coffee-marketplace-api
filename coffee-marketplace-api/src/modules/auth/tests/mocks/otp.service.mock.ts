/**
 * ------------------------------------------------------------------------
 * OTP Service Mock
 * ------------------------------------------------------------------------
 *
 * Mock implementation for OtpService.
 * Used by AuthService unit tests.
 * ------------------------------------------------------------------------
 */

export const otpServiceMock = {
  generate: jest.fn(),

  getExpiration: jest.fn(),

  validateFormat: jest.fn(),

  save: jest.fn(),

  verify: jest.fn(),
};
