import { Test } from '@nestjs/testing';

import { CartController } from '../controllers/cart.controller';
import { CartService } from '../services/cart.service';

import { AddCartItemDto, CartResponseDto, UpdateCartItemDto } from '../dto';

describe('CartController', () => {
  let controller: CartController;

  /**
   * Mock CartService.
   *
   * The controller unit test does not use
   * the real service implementation.
   */
  let service: {
    getOrCreateActiveCart: jest.Mock;
    addItem: jest.Mock;
    updateItem: jest.Mock;
    removeItem: jest.Mock;
    clearCart: jest.Mock;
  };

  beforeEach(async () => {
    /**
     * Create mocked service methods.
     */
    service = {
      /**
       * Mock active cart retrieval/creation.
       */
      getOrCreateActiveCart: jest.fn(),

      /**
       * Mock adding an item to the cart.
       */
      addItem: jest.fn(),

      /**
       * Mock updating a cart item.
       */
      updateItem: jest.fn(),

      /**
       * Mock removing a cart item.
       */
      removeItem: jest.fn(),

      /**
       * Mock clearing the cart.
       */
      clearCart: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [CartController],

      providers: [
        {
          provide: CartService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<CartController>(CartController);
  });

  /**
   * Mock authenticated user.
   */
  const user = {
    sub: 'user-id',
  };

  /**
   * Mock cart response.
   */
  const response: CartResponseDto = {
    id: 'cart-id',
    status: 'ACTIVE' as any,
    items: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // --------------------------------------------------
  // GET CART
  // --------------------------------------------------

  describe('getCart', () => {
    it('should get or create the active cart', async () => {
      /**
       * Mock service response.
       */
      service.getOrCreateActiveCart.mockResolvedValue(response);

      /**
       * Execute controller method.
       */
      const result = await controller.getCart(user as any);

      /**
       * Verify that the authenticated user's ID
       * is passed to the service.
       */
      expect(service.getOrCreateActiveCart).toHaveBeenCalledWith('user-id');

      /**
       * Verify returned response.
       */
      expect(result).toEqual(response);
    });
  });

  // --------------------------------------------------
  // ADD ITEM
  // --------------------------------------------------

  describe('addItem', () => {
    it('should add a product to the cart', async () => {
      const dto: AddCartItemDto = {
        productId: 'product-id',
        quantity: 2,
      };

      /**
       * Mock service response.
       */
      service.addItem.mockResolvedValue(response);

      /**
       * Execute controller method.
       */
      const result = await controller.addItem(user as any, dto);

      /**
       * Verify that the controller passes
       * the user ID and DTO to the service.
       */
      expect(service.addItem).toHaveBeenCalledWith('user-id', dto);

      /**
       * Verify returned response.
       */
      expect(result).toEqual(response);
    });
  });

  // --------------------------------------------------
  // UPDATE ITEM
  // --------------------------------------------------

  describe('updateItem', () => {
    it('should update cart item quantity', async () => {
      const dto: UpdateCartItemDto = {
        quantity: 5,
      };

      /**
       * Mock service response.
       */
      service.updateItem.mockResolvedValue(response);

      /**
       * Execute controller method.
       *
       * IMPORTANT:
       * The real controller receives the authenticated
       * user through the CurrentUser decorator.
       */
      const result = await controller.updateItem(
        user as any,
        'cart-item-id',
        dto,
      );

      /**
       * Verify the service call.
       */
      expect(service.updateItem).toHaveBeenCalledWith(
        'user-id',
        'cart-item-id',
        dto,
      );

      /**
       * Verify returned response.
       */
      expect(result).toEqual(response);
    });
  });

  // --------------------------------------------------
  // REMOVE ITEM
  // --------------------------------------------------

  describe('removeItem', () => {
    it('should remove a cart item', async () => {
      /**
       * Mock service response.
       */
      service.removeItem.mockResolvedValue(response);

      /**
       * Execute controller method.
       */
      const result = await controller.removeItem(user as any, 'cart-item-id');

      /**
       * Verify that the authenticated user's ID
       * and cart item ID are passed to the service.
       */
      expect(service.removeItem).toHaveBeenCalledWith(
        'user-id',
        'cart-item-id',
      );

      /**
       * Verify returned response.
       */
      expect(result).toEqual(response);
    });
  });

  // --------------------------------------------------
  // CLEAR CART
  // --------------------------------------------------

  describe('clearCart', () => {
    it('should clear the current user cart', async () => {
      /**
       * Mock service response.
       */
      service.clearCart.mockResolvedValue(response);

      /**
       * Execute controller method.
       */
      const result = await controller.clearCart(user as any);

      /**
       * Verify authenticated user's ID.
       */
      expect(service.clearCart).toHaveBeenCalledWith('user-id');

      /**
       * Verify returned response.
       */
      expect(result).toEqual(response);
    });
  });
});
