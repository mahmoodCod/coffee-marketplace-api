import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

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
 * All routes require a valid Bearer access token.
 * Business logic is delegated to OrderService.
 */
@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
  @ApiOkResponse({
    type: OrderResponseDto,
    isArray: true,
  })
  async getUserOrders(
    @CurrentUser()
    user: JwtPayload,
  ): Promise<OrderResponseDto[]> {
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
  @ApiOkResponse({
    type: OrderResponseDto,
  })
  async getOrderById(
    @Param('id', new ParseUUIDPipe())
    orderId: string,

    @CurrentUser()
    user: JwtPayload,
  ): Promise<OrderResponseDto> {
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
  @ApiCreatedResponse({
    type: OrderResponseDto,
  })
  async createOrder(
    @CurrentUser()
    user: JwtPayload,

    @Body()
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
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
  @ApiOkResponse({
    type: OrderResponseDto,
  })
  async cancelOrder(
    @Param('id', new ParseUUIDPipe())
    orderId: string,

    @CurrentUser()
    user: JwtPayload,
  ): Promise<OrderResponseDto> {
    return this.orderService.cancelOrder(user.sub, orderId);
  }
}
