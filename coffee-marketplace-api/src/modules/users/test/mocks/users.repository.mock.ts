/**
 * ------------------------------------------------------------------------
 * Users Repository Mock
 * ------------------------------------------------------------------------
 *
 * Mock implementation of UsersRepository used in unit tests.
 *
 * ------------------------------------------------------------------------
 */
export const usersRepositoryMock = {
  findAll: jest.fn(),

  findById: jest.fn(),

  findByPhone: jest.fn(),

  create: jest.fn(),

  save: jest.fn(),

  remove: jest.fn(),
};
