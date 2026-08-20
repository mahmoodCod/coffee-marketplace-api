import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

import { CreateOrderDto, OrderResponseDto } from '../dto';

import { OrderService } from '../services/order.service';

/**
 * Order Controller
 *
 * Handles HTTP requests related to customer orders.
 *
 * Responsibilities:
 * - Create orders from the active cart.
 * - Retrieve the authenticated user's order history.
 * - Retrieve a specific order belonging to the user.
 * - Cancel eligible orders.
 *
 * Business logic is delegated to OrderService.
 */
@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * GET /orders
   *
   * Returns all orders belonging to the
   * authenticated user.
   */
  @Get()
  @ApiOperation({
    summary: 'Get current user orders',
  })
  @ApiResponse({
    status: 200,
    description: 'User orders retrieved successfully.',
    type: [OrderResponseDto],
  })
  async getUserOrders(
    @CurrentUser()
    user: JwtPayload,
  ) {
    return this.orderService.getUserOrders(user.sub);
  }

  /**
   * GET /orders/:id
   *
   * Returns a specific order belonging
   * to the authenticated user.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get order by ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
  })
  async getOrderById(
    @Param('id')
    orderId: string,

    @CurrentUser()
    user: JwtPayload,
  ) {
    return this.orderService.getOrderById(user.sub, orderId);
  }

  /**
   * POST /orders
   *
   * Creates a new order from the
   * authenticated user's active cart.
   */
  @Post()
  @ApiOperation({
    summary: 'Create order from active cart',
  })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Cart is empty.',
  })
  @ApiResponse({
    status: 404,
    description: 'Shipping address or active cart not found.',
  })
  async createOrder(
    @CurrentUser()
    user: JwtPayload,

    @Body()
    dto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(user.sub, dto);
  }

  /**
   * PATCH /orders/:id/cancel
   *
   * Cancels an order belonging to the
   * authenticated user when cancellation
   * is still allowed.
   */
  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel order',
  })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled successfully.',
    type: OrderResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Order cannot be cancelled.',
  })
  @ApiResponse({
    status: 404,
    description: 'Order not found.',
  })
  async cancelOrder(
    @Param('id')
    orderId: string,

    @CurrentUser()
    user: JwtPayload,
  ) {
    return this.orderService.cancelOrder(user.sub, orderId);
  }
}
