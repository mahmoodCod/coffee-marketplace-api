import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CartRepository } from '../../cart/repositories/cart.repository';
import { CartStatus } from '../../cart/entities/cart-status.enum';

import { AddressesRepository } from '../../users/repositories/addresses.repository';

import { CreateOrderDto } from '../dto';

import { Order } from '../entities/order.entity';
import { OrderStatus } from '../enums';

import { OrderRepository } from '../repositories/order.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { Cart } from 'src/modules/cart/entities';
import { Address } from 'src/modules/users/entities/address.entity';
import { User } from 'src/modules/users/entities/user.entity';
import { OrderItem } from '../entities/order-item.entity';

/**
 * Order Service
 *
 * Handles order business logic.
 *
 * Responsibilities:
 * - Create orders from active carts.
 * - Validate shipping addresses.
 * - Validate cart contents.
 * - Calculate order prices.
 * - Manage order lifecycle.
 *
 * Business Rules:
 * - Orders are created from the user's active cart.
 * - Orders cannot be created from an empty cart.
 * - Shipping addresses must belong to the user.
 * - Cart items are converted into order items.
 * - The active cart is completed after order creation.
 * - Inventory is not reduced during order creation.
 * - Inventory decreases only after successful payment.
 */
@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: OrderRepository,

    @InjectRepository(Cart)
    private readonly cartRepository: CartRepository,

    @InjectRepository(Address)
    private readonly addressRepository: AddressesRepository,
  ) {}

  /**
   * Create an order from the user's active cart.
   *
   * Process:
   * 1. Find the user's active cart.
   * 2. Validate that the cart contains items.
   * 3. Validate that the shipping address belongs to the user.
   * 4. Calculate the order total.
   * 5. Create the order.
   * 6. Convert cart items into order items.
   * 7. Mark the cart as completed.
   */
  async createOrder(userId: string, dto: CreateOrderDto): Promise<Order> {
    /**
     * Find the user's current active cart.
     */
    const cart = await this.cartRepository.findActiveByUserId(userId);

    if (!cart) {
      throw new NotFoundException('Active cart not found.');
    }

    /**
     * Orders cannot be created from an empty cart.
     */
    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException(
        'Cannot create an order from an empty cart.',
      );
    }

    /**
     * Validate that the selected shipping address
     * belongs to the authenticated user.
     */
    const shippingAddress = await this.addressRepository.findByIdAndUserId(
      dto.shippingAddressId,
      userId,
    );

    if (!shippingAddress) {
      throw new NotFoundException('Shipping address not found.');
    }

    /**
     * Calculate the total price using the price
     * snapshot stored in each cart item.
     */
    const totalPrice = cart.items.reduce((total, item) => {
      return total + Number(item.unitPrice) * item.quantity;
    }, 0);

    /**
     * Create the order.
     *
     * Currently, no coupon functionality exists,
     * so finalPrice is equal to totalPrice.
     */
    const order = this.orderRepository.create({
      user: {
        id: userId,
      } as User,

      shippingAddress,

      status: OrderStatus.PENDING_PAYMENT,

      totalPrice: totalPrice.toFixed(2),

      finalPrice: totalPrice.toFixed(2),

      couponId: null,
    });

    /**
     * Convert cart items into order items.
     *
     * The product price stored in the cart is copied
     * to the order as a permanent price snapshot.
     */
    order.items = cart.items.map((cartItem) => ({
      quantity: cartItem.quantity,

      unitPrice: cartItem.unitPrice,

      product: cartItem.product,
    })) as OrderItem[];

    /**
     * Save the order with its order items.
     */
    const savedOrder = await this.orderRepository.save(order);

    /**
     * Mark the cart as completed because
     * it has successfully been converted into an order.
     */
    cart.status = CartStatus.COMPLETED;

    await this.cartRepository.save(cart);

    return savedOrder;
  }

  /**
   * Get all orders belonging to a specific user.
   *
   * Orders are returned in descending creation order.
   * A user can only access their own order history.
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.findAllByUserId(userId);
  }

  /**
   * Get a specific order belonging to a user.
   *
   * Business Rules:
   * - Users can only access their own orders.
   * - An error is thrown when the order does not exist
   *   or does not belong to the authenticated user.
   */
  async getOrderById(userId: string, orderId: string): Promise<Order> {
    const order = await this.orderRepository.findByIdAndUserId(orderId, userId);

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return order;
  }
}
