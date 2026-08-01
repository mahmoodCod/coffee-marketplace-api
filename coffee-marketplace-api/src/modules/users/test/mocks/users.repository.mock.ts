/**
 * ------------------------------------------------------------------------
 * Users Repository Mock
 * ------------------------------------------------------------------------
 *
 * Mock implementation of UsersRepository used in unit tests.
 * ------------------------------------------------------------------------
 */
export const usersRepositoryMock = {
  findById: jest.fn(),

  findByPhone: jest.fn(),

  create: jest.fn(),

  save: jest.fn(),

  softRemove: jest.fn(),
};
