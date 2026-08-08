import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { ProductService } from '../services/product.service';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

describe('ProductService', () => {
  let service: ProductService;

  /**
   * ------------------------------------------------------------------------
   * Mock Product Repository
   * ------------------------------------------------------------------------
   *
   * Fake repository used to isolate service logic.
   * ------------------------------------------------------------------------
   */
  const productsRepository = {
    create: jest.fn(),

    save: jest.fn(),

    find: jest.fn(),

    findOne: jest.fn(),

    exists: jest.fn(),

    softRemove: jest.fn(),
  };

  /**
   * ------------------------------------------------------------------------
   * Mock Users Service
   * ------------------------------------------------------------------------
   *
   * Used for loading seller information.
   * ------------------------------------------------------------------------
   */
  const usersService = {
    findById: jest.fn(),
  };

  beforeEach(() => {
    service = new ProductService(
      productsRepository as any,

      usersService as any,
    );

    jest.clearAllMocks();
  });

  /**
   * ------------------------------------------------------------------------
   * Fake Seller JWT Payload
   * ------------------------------------------------------------------------
   */
  const sellerPayload: JwtPayload = {
    sub: 'seller-id',

    phone: '989121234567',

    role: SYSTEM_ROLES.SELLER,
  };

  /**
   * ------------------------------------------------------------------------
   * Fake Customer JWT Payload
   * ------------------------------------------------------------------------
   */
  const customerPayload: JwtPayload = {
    sub: 'customer-id',

    phone: '989111111111',

    role: SYSTEM_ROLES.CUSTOMER,
  };

  /**
   * ------------------------------------------------------------------------
   * Fake Product Entity
   * ------------------------------------------------------------------------
   */
  const product = {
    id: 'product-id',

    title: 'Arabica Coffee',

    slug: 'arabica-coffee',

    price: 200000,

    seller: {
      id: 'seller-id',
    },

    createdAt: new Date(),

    updatedAt: new Date(),
  };

  /**
   * ------------------------------------------------------------------------
   * Service Definition
   * ------------------------------------------------------------------------
   */
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /**
   * ------------------------------------------------------------------------
   * Create Product Tests
   * ------------------------------------------------------------------------
   */
  describe('create', () => {
    /**
     * ------------------------------------------------------------------------
     * Should create product successfully
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Only sellers can create products.
     * ------------------------------------------------------------------------
     */
    it('should create product successfully', async () => {
      const dto = {
        title: 'Arabica Coffee',

        slug: 'arabica-coffee',

        price: 200000,
      };

      const seller = {
        id: 'seller-id',

        phone: '989121234567',
      };

      productsRepository.exists.mockResolvedValue(false);

      usersService.findById.mockResolvedValue(seller);

      productsRepository.create.mockReturnValue(product);

      productsRepository.save.mockResolvedValue(product);

      const result = await service.create(sellerPayload, dto as any);

      expect(productsRepository.exists).toHaveBeenCalledWith({
        where: {
          slug: dto.slug,
        },
      });

      expect(productsRepository.create).toHaveBeenCalled();

      expect(result).toEqual(product);
    });

    /**
     * ------------------------------------------------------------------------
     * Should reject customer creating product
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Customers cannot create products.
     * ------------------------------------------------------------------------
     */
    it('should throw error when customer creates product', async () => {
      await expect(service.create(customerPayload, {} as any)).rejects.toThrow(
        ForbiddenException,
      );

      expect(productsRepository.create).not.toHaveBeenCalled();
    });

    /**
     * ------------------------------------------------------------------------
     * Should reject duplicated slug
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Product slug must be unique.
     * ------------------------------------------------------------------------
     */
    it('should throw error when slug already exists', async () => {
      const dto = {
        title: 'Arabica Coffee',

        slug: 'arabica-coffee',

        price: 200000,
      };

      productsRepository.exists.mockResolvedValue(true);

      await expect(service.create(sellerPayload, dto as any)).rejects.toThrow();

      expect(productsRepository.create).not.toHaveBeenCalled();
    });
  });
});
