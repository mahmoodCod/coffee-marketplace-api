import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { ProductService } from '../services/product.service';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { ProductStatus } from '../enums';

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

  /**
   * ------------------------------------------------------------------------
   * Update Product Tests
   * ------------------------------------------------------------------------
   */
  describe('update', () => {
    /**
     * ------------------------------------------------------------------------
     * Should update product successfully
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Seller can update only own products.
     * ------------------------------------------------------------------------
     */
    it('should update product successfully', async () => {
      const dto = {
        title: 'Updated Arabica Coffee',

        price: 250000,
      };

      productsRepository.findOne.mockResolvedValue({
        ...product,
      });

      productsRepository.save.mockResolvedValue({
        ...product,

        ...dto,
      });

      const result = await service.update(
        'product-id',
        sellerPayload,
        dto as any,
      );

      expect(productsRepository.findOne).toHaveBeenCalled();

      expect(productsRepository.save).toHaveBeenCalled();

      expect(result.title).toBe(dto.title);
    });

    /**
     * ------------------------------------------------------------------------
     * Should reject customer update
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Customers cannot update products.
     * ------------------------------------------------------------------------
     */
    it('should throw error when customer updates product', async () => {
      await expect(
        service.update('product-id', customerPayload, {} as any),
      ).rejects.toThrow(ForbiddenException);

      expect(productsRepository.findOne).not.toHaveBeenCalled();
    });

    /**
     * ------------------------------------------------------------------------
     * Should reject updating another seller product
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Seller can manage only own products.
     * ------------------------------------------------------------------------
     */
    it('should throw error when seller does not own product', async () => {
      productsRepository.findOne.mockResolvedValue({
        ...product,

        seller: {
          id: 'another-seller-id',
        },
      });

      await expect(
        service.update('product-id', sellerPayload, {
          title: 'New title',
        } as any),
      ).rejects.toThrow(ForbiddenException);

      expect(productsRepository.save).not.toHaveBeenCalled();
    });

    /**
     * ------------------------------------------------------------------------
     * Should reject duplicated slug update
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Product slug must remain unique.
     * ------------------------------------------------------------------------
     */
    it('should throw error when updated slug already exists', async () => {
      productsRepository.findOne.mockResolvedValue(product);

      productsRepository.exists.mockResolvedValue(true);

      await expect(
        service.update('product-id', sellerPayload, {
          slug: 'existing-slug',
        } as any),
      ).rejects.toThrow();

      expect(productsRepository.save).not.toHaveBeenCalled();
    });
  });

  /**
   * ------------------------------------------------------------------------
   * Soft Delete Product Tests
   * ------------------------------------------------------------------------
   */
  describe('softDelete', () => {
    /**
     * ------------------------------------------------------------------------
     * Should soft delete product successfully
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Seller can delete only own products.
     * ------------------------------------------------------------------------
     */
    it('should soft delete product successfully', async () => {
      productsRepository.findOne.mockResolvedValue(product);

      productsRepository.softRemove.mockResolvedValue(product);

      await service.softDelete('product-id', sellerPayload);

      expect(productsRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'product-id',
        },

        relations: {
          seller: true,
        },
      });

      expect(productsRepository.softRemove).toHaveBeenCalledWith(product);
    });

    /**
     * ------------------------------------------------------------------------
     * Should reject customer delete
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Only sellers can delete products.
     * ------------------------------------------------------------------------
     */
    it('should throw error when customer deletes product', async () => {
      await expect(
        service.softDelete('product-id', customerPayload),
      ).rejects.toThrow(ForbiddenException);

      expect(productsRepository.findOne).not.toHaveBeenCalled();

      expect(productsRepository.softRemove).not.toHaveBeenCalled();
    });

    /**
     * ------------------------------------------------------------------------
     * Should reject deleting another seller product
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Seller cannot delete products
     * belonging to another seller.
     * ------------------------------------------------------------------------
     */
    it('should throw error when seller does not own product', async () => {
      productsRepository.findOne.mockResolvedValue({
        ...product,

        seller: {
          id: 'another-seller-id',
        },
      });

      await expect(
        service.softDelete('product-id', sellerPayload),
      ).rejects.toThrow(ForbiddenException);

      expect(productsRepository.softRemove).not.toHaveBeenCalled();
    });
  });

  /**
   * ------------------------------------------------------------------------
   * Find Products Tests
   * ------------------------------------------------------------------------
   */
  describe('findAll', () => {
    /**
     * ------------------------------------------------------------------------
     * Should return active products
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Customers can see available products.
     * ------------------------------------------------------------------------
     */
    it('should return all active products', async () => {
      productsRepository.find.mockResolvedValue([product]);

      const result = await service.findAll();

      expect(productsRepository.find).toHaveBeenCalledWith({
        where: {
          status: ProductStatus.ACTIVE,
        },

        order: {
          createdAt: 'DESC',
        },
      });

      expect(result).toEqual([product]);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * Find One Product Tests
   * ------------------------------------------------------------------------
   */
  describe('findOne', () => {
    /**
     * ------------------------------------------------------------------------
     * Should return product details
     * ------------------------------------------------------------------------
     */
    it('should return product details', async () => {
      productsRepository.findOne.mockResolvedValue(product);

      const result = await service.findOne('product-id');

      expect(productsRepository.findOne).toHaveBeenCalled();

      expect(result).toEqual(product);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * Find Seller Products Tests
   * ------------------------------------------------------------------------
   */
  describe('findSellerProducts', () => {
    /**
     * ------------------------------------------------------------------------
     * Should return seller products
     * ------------------------------------------------------------------------
     *
     * Business Rule:
     *
     * Seller dashboard only shows
     * products owned by seller.
     * ------------------------------------------------------------------------
     */
    it('should return seller products', async () => {
      productsRepository.find.mockResolvedValue([product]);

      const result = await service.findSellerProducts('seller-id');

      expect(productsRepository.find).toHaveBeenCalledWith({
        where: {
          seller: {
            id: 'seller-id',
          },
        },

        order: {
          createdAt: 'DESC',
        },
      });

      expect(result).toEqual([product]);
    });
  });
});
