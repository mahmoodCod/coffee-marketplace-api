import { Test, TestingModule } from '@nestjs/testing';

import { RolesController } from '../controllers/roles.controller';

import { RolesService } from '../services/roles.service';

import { rolesServiceMock } from './mocks/roles.service.mock';

/**
 * ------------------------------------------------------------------------
 * Roles Controller Unit Tests
 * ------------------------------------------------------------------------
 *
 * Verifies controller behavior.
 *
 * Business logic is NOT tested here.
 * Service layer is mocked.
 * ------------------------------------------------------------------------
 */

describe('RolesController', () => {
  let controller: RolesController;

  let service: jest.Mocked<RolesService>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RolesController],

      providers: [
        {
          provide: RolesService,

          useValue: rolesServiceMock,
        },
      ],
    }).compile();

    controller = module.get(RolesController);

    service = module.get(RolesService);
  });

  /**
   * ---------------------------------------------------
   * Initialization
   * ---------------------------------------------------
   */

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /**
   * ---------------------------------------------------
   * findAll()
   * ---------------------------------------------------
   */

  describe('findAll()', () => {
    it('should return all roles', async () => {
      const roles = [
        {
          id: '1',

          name: 'admin',
        },
      ];

      service.findAll.mockResolvedValue(roles as any);

      const result = await controller.findAll();

      expect(result).toEqual(roles);

      expect(service.findAll).toHaveBeenCalled();
    });
  });

  /**
   * ---------------------------------------------------
   * findOne()
   * ---------------------------------------------------
   */

  describe('findOne()', () => {
    it('should return role by id', async () => {
      const role = {
        id: '1',

        name: 'admin',
      };

      service.findById.mockResolvedValue(role as any);

      const result = await controller.findOne('1');

      expect(result).toEqual(role);

      expect(service.findById).toHaveBeenCalledWith('1');
    });
  });

  /**
   * ---------------------------------------------------
   * create()
   * ---------------------------------------------------
   */

  describe('create()', () => {
    it('should create role', async () => {
      const dto = {
        name: 'seller',
      };

      const role = {
        id: '1',

        ...dto,
      };

      service.create.mockResolvedValue(role as any);

      const result = await controller.create(dto as any);

      expect(result).toEqual(role);

      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  /**
   * ---------------------------------------------------
   * update()
   * ---------------------------------------------------
   */

  describe('update()', () => {
    it('should update role', async () => {
      const dto = {
        description: 'updated',
      };

      const role = {
        id: '1',

        name: 'admin',

        ...dto,
      };

      service.update.mockResolvedValue(role as any);

      const result = await controller.update('1', dto as any);

      expect(result).toEqual(role);

      expect(service.update).toHaveBeenCalledWith('1', dto);
    });
  });

  /**
   * ---------------------------------------------------
   * delete()
   * ---------------------------------------------------
   */

  describe('delete()', () => {
    it('should delete role', async () => {
      service.delete.mockResolvedValue(undefined);

      await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');
    });
  });
});
