/**
 * ------------------------------------------------------------------------
 * Roles Repository Mock
 * ------------------------------------------------------------------------
 *
 * Centralized mock for RolesRepository.
 * Used by AuthService when resolving the default customer role.
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
