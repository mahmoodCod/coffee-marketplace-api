/**
 * ------------------------------------------------------------------------
 * Users Repository Mock
 * ------------------------------------------------------------------------
 *
 * Centralized mock for UsersRepository.
 * Used by AuthService unit tests.
 * ------------------------------------------------------------------------
 */

export const usersRepositoryMock = {
  findById: jest.fn(),

  findByPhone: jest.fn(),

  create: jest.fn(),

  save: jest.fn(),

  remove: jest.fn(),
};
