import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CartRepository } from '../../cart/repositories/cart.repository';
import { CartStatus } from '../../cart/entities/cart-status.enum';

import { AddressesRepository } from '../../users/repositories/addresses.repository';

import { CreateOrderDto, OrderItemResponseDto, OrderResponseDto } from '../dto';

import { Order } from '../entities/order.entity';
import { OrderStatus } from '../enums';

import { OrderRepository } from '../repositories/order.repository';

import { User } from '../../users/entities/user.entity';

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
 *
 * Database access is delegated to OrderRepository,
 * CartRepository, and AddressesRepository.
 * API responses are mapped to DTOs so entities
 * are never exposed directly.
 */
@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,

    private readonly cartRepository: CartRepository,

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
  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
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

    /**
     * Reload the order with relations required
     * for the public API response.
     */
    const completeOrder = await this.orderRepository.findByIdAndUserId(
      savedOrder.id,
      userId,
    );

    if (!completeOrder) {
      throw new NotFoundException('Order not found.');
    }

    return this.toOrderResponse(completeOrder, userId);
  }

  /**
   * Get all orders belonging to a specific user.
   *
   * Orders are returned in descending creation order.
   * A user can only access their own order history.
   */
  async getUserOrders(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.findAllByUserId(userId);

    return orders.map((order) => this.toOrderResponse(order, userId));
  }

  /**
   * Get a specific order belonging to a user.
   *
   * Business Rules:
   * - Users can only access their own orders.
   * - An error is thrown when the order does not exist
   *   or does not belong to the authenticated user.
   */
  async getOrderById(
    userId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findByIdAndUserId(orderId, userId);

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    return this.toOrderResponse(order, userId);
  }

  /**
   * Cancel an order belonging to the authenticated user.
   *
   * Business Rules:
   * - Users can only cancel their own orders.
   * - Orders cannot be cancelled after shipment.
   * - Completed or delivered orders cannot be cancelled.
   */
  async cancelOrder(
    userId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    /**
     * Find the order while ensuring that it belongs
     * to the authenticated user.
     */
    const order = await this.orderRepository.findByIdAndUserId(orderId, userId);

    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    /**
     * An order cannot be cancelled after it has been shipped.
     */
    if (
      order.status === OrderStatus.SHIPPED ||
      order.status === OrderStatus.DELIVERED
    ) {
      throw new BadRequestException(
        'Orders cannot be cancelled after shipment.',
      );
    }

    /**
     * Prevent cancelling an order that has already
     * been cancelled.
     */
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order is already cancelled.');
    }

    /**
     * Update the order lifecycle status.
     */
    order.status = OrderStatus.CANCELLED;

    const cancelledOrder = await this.orderRepository.save(order);

    return this.toOrderResponse(cancelledOrder, userId);
  }

  /**
   * Maps an Order entity to the public order response DTO.
   */
  private toOrderResponse(order: Order, userId: string): OrderResponseDto {
    return {
      id: order.id,
      status: order.status,
      userId,
      shippingAddressId: order.shippingAddress.id,
      totalPrice: order.totalPrice,
      finalPrice: order.finalPrice,
      couponId: order.couponId,
      trackingCode: order.trackingCode,
      paidAt: order.paidAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      items: (order.items ?? []).map((item) =>
        this.toOrderItemResponse(item, order.id),
      ),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  /**
   * Maps an OrderItem entity to the public order item response DTO.
   */
  private toOrderItemResponse(
    item: OrderItem,
    orderId: string,
  ): OrderItemResponseDto {
    return {
      id: item.id,
      orderId,
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
