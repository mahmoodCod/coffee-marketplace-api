import { Test } from '@nestjs/testing';

import { CartService } from '../services/cart.service';

import { CartRepository } from '../repositories/cart.repository';
import { CartItemRepository } from '../repositories/cart-item.repository';

import { CartStatus } from '../entities/cart-status.enum';

describe('CartService', () => {
  let service: CartService;

  let cartRepository: {
    findActiveByUserId: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  let cartItemRepository: {
    findById: jest.Mock;
    findByCartAndProduct: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    delete: jest.Mock;
  };

  beforeEach(async () => {
    /**
     * Mock CartRepository methods used by CartService.
     */
    cartRepository = {
      findActiveByUserId: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    /**
     * Mock CartItemRepository methods.
     *
     * These methods are not used by the current tests,
     * but they are required by the CartService constructor.
     */
    cartItemRepository = {
      findById: jest.fn(),
      findByCartAndProduct: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: CartRepository,
          useValue: cartRepository,
        },
        {
          provide: CartItemRepository,
          useValue: cartItemRepository,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  /**
   * Test active cart retrieval.
   */
  describe('getOrCreateActiveCart', () => {
    it('should return the existing active cart', async () => {
      const cart = {
        id: 'cart-id',
        status: CartStatus.ACTIVE,
        user: {
          id: 'user-id',
        },
        items: [],
      };

      /**
       * Simulate an existing active cart.
       */
      cartRepository.findActiveByUserId.mockResolvedValue(cart);

      const result = await service.getOrCreateActiveCart('user-id');

      /**
       * The repository should be queried
       * using the authenticated user's ID.
       */
      expect(cartRepository.findActiveByUserId).toHaveBeenCalledWith('user-id');

      /**
       * No new cart should be created when
       * an active cart already exists.
       */
      expect(cartRepository.create).not.toHaveBeenCalled();

      expect(cartRepository.save).not.toHaveBeenCalled();

      expect(result).toEqual(cart);
    });

    it('should create a new active cart when no active cart exists', async () => {
      const newCart = {
        status: CartStatus.ACTIVE,
        user: {
          id: 'user-id',
        },
      };

      const savedCart = {
        id: 'cart-id',
        status: CartStatus.ACTIVE,
        user: {
          id: 'user-id',
        },
        items: [],
      };

      /**
       * Simulate the absence of an active cart.
       */
      cartRepository.findActiveByUserId.mockResolvedValue(null);

      /**
       * Mock repository entity creation.
       */
      cartRepository.create.mockReturnValue(newCart);

      /**
       * Mock successful database persistence.
       */
      cartRepository.save.mockResolvedValue(savedCart);

      const result = await service.getOrCreateActiveCart('user-id');

      expect(cartRepository.findActiveByUserId).toHaveBeenCalledWith('user-id');

      /**
       * Verify that a new ACTIVE cart is created
       * for the correct user.
       */
      expect(cartRepository.create).toHaveBeenCalledWith({
        status: CartStatus.ACTIVE,
        user: {
          id: 'user-id',
        },
      });

      /**
       * Verify that the new cart is persisted.
       */
      expect(cartRepository.save).toHaveBeenCalledWith(newCart);

      expect(result).toEqual(savedCart);
    });
  });

  /**
   * Test active cart lookup without automatic creation.
   */
  describe('getActiveCart', () => {
    it('should return the existing active cart', async () => {
      const cart = {
        id: 'cart-id',
        status: CartStatus.ACTIVE,
        user: {
          id: 'user-id',
        },
        items: [],
      };

      cartRepository.findActiveByUserId.mockResolvedValue(cart);

      const result = await service.getActiveCart('user-id');

      expect(cartRepository.findActiveByUserId).toHaveBeenCalledWith('user-id');

      expect(result).toEqual(cart);
    });

    it('should throw NotFoundException when active cart does not exist', async () => {
      /**
       * Simulate a user without an active cart.
       */
      cartRepository.findActiveByUserId.mockResolvedValue(null);

      await expect(service.getActiveCart('user-id')).rejects.toThrow(
        'Active cart not found.',
      );

      expect(cartRepository.findActiveByUserId).toHaveBeenCalledWith('user-id');
    });
  });
});
