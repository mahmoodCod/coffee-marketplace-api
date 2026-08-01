/**
 * ------------------------------------------------------------------------
 * Addresses Repository Mock
 * ------------------------------------------------------------------------
 *
 * Mock implementation of AddressesRepository used in unit tests.
 *
 * ------------------------------------------------------------------------
 */
export const addressesRepositoryMock = {
  findByUserId: jest.fn(),

  findById: jest.fn(),

  findByIdForUser: jest.fn(),

  create: jest.fn(),

  save: jest.fn(),

  remove: jest.fn(),
};
