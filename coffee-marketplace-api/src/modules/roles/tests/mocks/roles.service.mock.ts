/**
 * ------------------------------------------------------------------------
 * Roles Service Mock
 * ------------------------------------------------------------------------
 *
 * Mock implementation for RolesService.
 *
 * Used by controller unit tests.
 * ------------------------------------------------------------------------
 */

export const rolesServiceMock = {
  findAll: jest.fn(),

  findById: jest.fn(),

  create: jest.fn(),

  update: jest.fn(),

  delete: jest.fn(),
};
