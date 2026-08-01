/**
 * ------------------------------------------------------------------------
 * Users Service Mock
 * ------------------------------------------------------------------------
 *
 * Mock implementation of UsersService.
 * Used by UsersController unit tests.
 * ------------------------------------------------------------------------
 */
export const usersServiceMock = {
  findById: jest.fn(),

  findByPhone: jest.fn(),

  getProfile: jest.fn(),

  updateProfile: jest.fn(),

  getAddresses: jest.fn(),

  createAddress: jest.fn(),

  updateAddress: jest.fn(),

  deleteAddress: jest.fn(),
};
