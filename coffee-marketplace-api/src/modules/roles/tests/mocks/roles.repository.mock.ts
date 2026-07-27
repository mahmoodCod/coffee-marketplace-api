/**
 * ------------------------------------------------------------------------
 * Roles Repository Mock
 * ------------------------------------------------------------------------
 *
 * Centralized mock implementation for RolesRepository.
 *
 * Every Roles module unit test should use this mock instead of
 * redefining repository methods.
 * ------------------------------------------------------------------------
 */

export const rolesRepositoryMock = {
  findAll: jest.fn(),

  findById: jest.fn(),

  findByName: jest.fn(),

  create: jest.fn(),

  save: jest.fn(),

  remove: jest.fn(),
};
