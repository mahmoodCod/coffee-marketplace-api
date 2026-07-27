import { Test, TestingModule } from '@nestjs/testing';

import { ConflictException, NotFoundException } from '@nestjs/common';

import { RolesService } from '../services/roles.service';

import { RolesRepository } from '../repositories/roles.repository';

import { rolesRepositoryMock } from './mocks/roles.repository.mock';

/**
 * ------------------------------------------------------------------------
 * Roles Service Unit Tests
 * ------------------------------------------------------------------------
 *
 * Verifies every business rule implemented inside RolesService.
 *
 * Database is completely mocked.
 * ------------------------------------------------------------------------
 */

describe('RolesService', () => {
  let service: RolesService;

  let repository: jest.Mocked<RolesRepository>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,

        {
          provide: RolesRepository,
          useValue: rolesRepositoryMock,
        },
      ],
    }).compile();

    service = module.get(RolesService);

    repository = module.get(RolesRepository);
  });

  /**
   * ---------------------------------------------------
   * Service Initialization
   * ---------------------------------------------------
   */

  it('should be defined', () => {
    expect(service).toBeDefined();
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

      repository.findAll.mockResolvedValue(roles as any);

      const result = await service.findAll();

      expect(result).toEqual(roles);

      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });
  });

  /**
   * ---------------------------------------------------
   * findById()
   * ---------------------------------------------------
   */

  describe('findById()', () => {
    it('should return role by id', async () => {
      const role = {
        id: '1',

        name: 'admin',
      };

      repository.findById.mockResolvedValue(role as any);

      const result = await service.findById('1');

      expect(result).toEqual(role);

      expect(repository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException when role does not exist', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  /**
   * ---------------------------------------------------
   * create()
   * ---------------------------------------------------
   */

  describe('create()', () => {
    it('should create a new role', async () => {
      repository.findByName.mockResolvedValue(null);

      const role = {
        id: '1',

        name: 'manager',
      };

      repository.create.mockResolvedValue(role as any);

      const result = await service.create({
        name: 'manager',
      });

      expect(result).toEqual(role);

      expect(repository.findByName).toHaveBeenCalledWith('manager');

      expect(repository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException when role already exists', async () => {
      repository.findByName.mockResolvedValue({
        id: '1',

        name: 'admin',
      } as any);

      await expect(
        service.create({
          name: 'admin',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  /**
   * ---------------------------------------------------
   * update()
   * ---------------------------------------------------
   */

  describe('update()', () => {
    it('should update existing role', async () => {
      const role = {
        id: '1',

        name: 'admin',
      };

      repository.findById.mockResolvedValue(role as any);

      repository.save.mockResolvedValue({
        ...role,

        description: 'updated',
      } as any);

      const result = await service.update('1', {
        description: 'updated',
      });

      expect(repository.save).toHaveBeenCalled();

      expect(result.description).toEqual('updated');
    });
  });

  /**
   * ---------------------------------------------------
   * delete()
   * ---------------------------------------------------
   */

  describe('delete()', () => {
    it('should delete existing role', async () => {
      const role = {
        id: '1',

        name: 'admin',
      };

      repository.findById.mockResolvedValue(role as any);

      repository.remove.mockResolvedValue(role as any);

      await service.delete('1');

      expect(repository.remove).toHaveBeenCalledWith(role);
    });
  });
});
