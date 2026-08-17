import { Test, TestingModule } from '@nestjs/testing';

import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { CartService } from '../services/cart.service';

import { Cart } from '../entities/cart.entity';

import { CartItem } from '../entities/cart-item.entity';

import { Product } from '../../products/entities/product.entity';

import { AddCartItemDto, UpdateCartItemDto } from '../dto';

describe('CartService', () => {
  let service: CartService;

  let cartRepository: jest.Mocked<Partial<Repository<Cart>>>;

  let cartItemRepository: jest.Mocked<Partial<Repository<CartItem>>>;

  let productRepository: jest.Mocked<Partial<Repository<Product>>>;

  beforeEach(async () => {
    /**
     * Mock Cart repository methods used by CartService.
     */
    cartRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    /**
     * Mock CartItem repository methods used by CartService.
     */
    cartItemRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
    };

    /**
     * Mock Product repository methods used by CartService.
     */
    productRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,

        {
          provide: getRepositoryToken(Cart),
          useValue: cartRepository,
        },

        {
          provide: getRepositoryToken(CartItem),
          useValue: cartItemRepository,
        },

        {
          provide: getRepositoryToken(Product),
          useValue: productRepository,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  /**
   * ------------------------------------------------------------------------
   * Get Or Create Active Cart
   * ------------------------------------------------------------------------
   */
  describe('getOrCreateActiveCart', () => {
    it('should return existing active cart', async () => {
      const cart = {
        id: 'cart-id',
        status: 'ACTIVE',
        items: [],
      } as unknown as Cart;

      cartRepository.findOne!.mockResolvedValue(cart);

      const result = await service.getOrCreateActiveCart('user-id');

      expect(cartRepository.findOne).toHaveBeenCalled();

      expect(cartRepository.create).not.toHaveBeenCalled();

      expect(result).toEqual(cart);
    });

    it('should create an active cart when user has no active cart', async () => {
      const newCart = {
        id: 'cart-id',
        status: 'ACTIVE',
        items: [],
      } as unknown as Cart;

      cartRepository.findOne!.mockResolvedValue(null);

      cartRepository.create!.mockReturnValue(newCart);

      cartRepository.save!.mockResolvedValue(newCart);

      const result = await service.getOrCreateActiveCart('user-id');

      expect(cartRepository.create).toHaveBeenCalledWith({
        user: {
          id: 'user-id',
        },
        status: 'ACTIVE',
      });

      expect(cartRepository.save).toHaveBeenCalledWith(newCart);

      expect(result).toEqual(newCart);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * Add Item
   * ------------------------------------------------------------------------
   */
  describe('addItem', () => {
    const product = {
      id: 'product-id',
      price: '150000',
      inventory: {
        stock: 20,
      },
    } as unknown as Product;

    const cart = {
      id: 'cart-id',
      status: 'ACTIVE',
      items: [],
    } as unknown as Cart;

    it('should add a new product to the cart', async () => {
      const dto: AddCartItemDto = {
        productId: 'product-id',
        quantity: 2,
      };

      const cartItem = {
        id: 'cart-item-id',
        cart,
        product,
        quantity: 2,
        unitPrice: '150000',
      } as unknown as CartItem;

      productRepository.findOne!.mockResolvedValue(product);

      cartRepository.findOne!.mockResolvedValue(cart);

      cartItemRepository.findOne!.mockResolvedValue(null);

      cartItemRepository.create!.mockReturnValue(cartItem);

      cartItemRepository.save!.mockResolvedValue(cartItem);

      const result = await service.addItem('user-id', dto);

      expect(productRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
      );

      expect(cartItemRepository.findOne).toHaveBeenCalled();

      expect(cartItemRepository.create).toHaveBeenCalledWith({
        cart,
        product,
        quantity: 2,
        unitPrice: '150000',
      });

      expect(cartItemRepository.save).toHaveBeenCalledWith(cartItem);

      expect(result).toEqual(cartItem);
    });

    it('should increase quantity when product already exists in cart', async () => {
      const dto: AddCartItemDto = {
        productId: 'product-id',
        quantity: 3,
      };

      const existingItem = {
        id: 'cart-item-id',
        cart,
        product,
        quantity: 2,
        unitPrice: '150000',
      } as unknown as CartItem;

      productRepository.findOne!.mockResolvedValue(product);

      cartRepository.findOne!.mockResolvedValue(cart);

      cartItemRepository.findOne!.mockResolvedValue(existingItem);

      cartItemRepository.save!.mockResolvedValue(existingItem);

      const result = await service.addItem('user-id', dto);

      expect(existingItem.quantity).toBe(5);

      expect(cartItemRepository.save).toHaveBeenCalledWith(existingItem);

      expect(result).toEqual(existingItem);
    });

    it('should reject quantity greater than inventory', async () => {
      const dto: AddCartItemDto = {
        productId: 'product-id',
        quantity: 25,
      };

      productRepository.findOne!.mockResolvedValue(product);

      await expect(service.addItem('user-id', dto)).rejects.toThrow(
        'Requested quantity exceeds available inventory.',
      );

      expect(cartRepository.findOne).not.toHaveBeenCalled();
    });

    it('should reject zero quantity', async () => {
      const dto: AddCartItemDto = {
        productId: 'product-id',
        quantity: 0,
      };

      productRepository.findOne!.mockResolvedValue(product);

      await expect(service.addItem('user-id', dto)).rejects.toThrow(
        'Quantity must be greater than zero.',
      );
    });

    it('should reject negative quantity', async () => {
      const dto: AddCartItemDto = {
        productId: 'product-id',
        quantity: -1,
      };

      productRepository.findOne!.mockResolvedValue(product);

      await expect(service.addItem('user-id', dto)).rejects.toThrow(
        'Quantity must be greater than zero.',
      );
    });

    it('should reject a non-existing product', async () => {
      const dto: AddCartItemDto = {
        productId: 'invalid-product-id',
        quantity: 1,
      };

      productRepository.findOne!.mockResolvedValue(null);

      await expect(service.addItem('user-id', dto)).rejects.toThrow(
        'Product not found.',
      );
    });

    it('should reject product without inventory', async () => {
      const dto: AddCartItemDto = {
        productId: 'product-id',
        quantity: 1,
      };

      const productWithoutInventory = {
        ...product,
        inventory: null,
      } as unknown as Product;

      productRepository.findOne!.mockResolvedValue(productWithoutInventory);

      await expect(service.addItem('user-id', dto)).rejects.toThrow(
        'Product inventory not found.',
      );
    });
  });

  /**
   * ------------------------------------------------------------------------
   * Update Item
   * ------------------------------------------------------------------------
   */
  describe('updateItem', () => {
    it('should update cart item quantity', async () => {
      const dto: UpdateCartItemDto = {
        quantity: 5,
      };

      const cart = {
        id: 'cart-id',
        status: 'ACTIVE',
      } as unknown as Cart;

      const cartItem = {
        id: 'item-id',
        cart,
        quantity: 2,
        product: {
          id: 'product-id',
          inventory: {
            stock: 10,
          },
        },
      } as unknown as CartItem;

      cartRepository.findOne!.mockResolvedValue(cart);

      cartItemRepository.findOne!.mockResolvedValue(cartItem);

      cartItemRepository.save!.mockResolvedValue(cartItem);

      const result = await service.updateItem('user-id', 'item-id', dto);

      expect(cartItem.quantity).toBe(5);

      expect(cartItemRepository.save).toHaveBeenCalledWith(cartItem);

      expect(result).toEqual(cartItem);
    });

    it('should reject quantity greater than inventory', async () => {
      const dto: UpdateCartItemDto = {
        quantity: 15,
      };

      const cart = {
        id: 'cart-id',
      } as unknown as Cart;

      const cartItem = {
        id: 'item-id',
        cart,
        product: {
          inventory: {
            stock: 10,
          },
        },
      } as unknown as CartItem;

      cartRepository.findOne!.mockResolvedValue(cart);

      cartItemRepository.findOne!.mockResolvedValue(cartItem);

      await expect(
        service.updateItem('user-id', 'item-id', dto),
      ).rejects.toThrow('Requested quantity exceeds available inventory.');
    });

    it('should reject non-existing cart item', async () => {
      const dto: UpdateCartItemDto = {
        quantity: 2,
      };

      const cart = {
        id: 'cart-id',
      } as unknown as Cart;

      cartRepository.findOne!.mockResolvedValue(cart);

      cartItemRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.updateItem('user-id', 'item-id', dto),
      ).rejects.toThrow('Cart item not found.');
    });
  });

  /**
   * ------------------------------------------------------------------------
   * Remove Item
   * ------------------------------------------------------------------------
   */
  describe('removeItem', () => {
    it('should remove a cart item', async () => {
      const cart = {
        id: 'cart-id',
      } as unknown as Cart;

      const cartItem = {
        id: 'item-id',
        cart,
      } as unknown as CartItem;

      cartRepository.findOne!.mockResolvedValue(cart);

      cartItemRepository.findOne!.mockResolvedValue(cartItem);

      cartItemRepository.remove!.mockResolvedValue(cartItem);

      await service.removeItem('user-id', 'item-id');

      expect(cartItemRepository.remove).toHaveBeenCalledWith(cartItem);
    });

    it('should reject removing a non-existing cart item', async () => {
      const cart = {
        id: 'cart-id',
      } as unknown as Cart;

      cartRepository.findOne!.mockResolvedValue(cart);

      cartItemRepository.findOne!.mockResolvedValue(null);

      await expect(service.removeItem('user-id', 'item-id')).rejects.toThrow(
        'Cart item not found.',
      );
    });
  });

  /**
   * ------------------------------------------------------------------------
   * Clear Cart
   * ------------------------------------------------------------------------
   */
  describe('clearCart', () => {
    it('should remove all items from the active cart', async () => {
      const cart = {
        id: 'cart-id',
      } as unknown as Cart;

      cartRepository.findOne!.mockResolvedValue(cart);

      cartItemRepository.delete!.mockResolvedValue({
        affected: 2,
      });

      await service.clearCart('user-id');

      expect(cartItemRepository.delete).toHaveBeenCalledWith({
        cart: {
          id: 'cart-id',
        },
      });
    });
  });
});
