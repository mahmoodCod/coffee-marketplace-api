import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

import { RolesGuard } from '../../../common/guards/roles.guard';

import { Roles } from '../../../common/decorators/roles.decorator';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import { OrderResponseDto, UpdateOrderStatusDto } from '../dto';

import { OrderService } from '../services/order.service';

/**
 * Admin Orders Controller
 *
 * Handles administrator order management endpoints.
 *
 * Responsibilities:
 * - List all orders.
 * - Update order lifecycle status.
 * - Mark orders as shipped.
 * - Mark orders as delivered.
 *
 * Security:
 * - JWT Authentication
 * - Admin Role Authorization
 */
@ApiTags('Admin Orders')
@ApiBearerAuth()
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.ADMIN)
export class AdminOrdersController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * GET /admin/orders
   *
   * Returns all orders for administration.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all orders for admin',
  })
  @ApiOkResponse({
    type: OrderResponseDto,
    isArray: true,
  })
  async getAllOrders(): Promise<OrderResponseDto[]> {
    return this.orderService.getAllOrders();
  }

  /**
   * PATCH /admin/orders/:id/status
   *
   * Updates the lifecycle status of an order.
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update order status',
  })
  @ApiOkResponse({
    type: OrderResponseDto,
  })
  async updateOrderStatus(
    @Param('id', new ParseUUIDPipe())
    orderId: string,

    @Body()
    dto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.orderService.updateOrderStatus(orderId, dto);
  }

  /**
   * PATCH /admin/orders/:id/ship
   *
   * Marks a paid order as shipped.
   */
  @Patch(':id/ship')
  @ApiOperation({
    summary: 'Mark order as shipped',
  })
  @ApiOkResponse({
    type: OrderResponseDto,
  })
  async shipOrder(
    @Param('id', new ParseUUIDPipe())
    orderId: string,
  ): Promise<OrderResponseDto> {
    return this.orderService.shipOrder(orderId);
  }

  /**
   * PATCH /admin/orders/:id/deliver
   *
   * Marks a shipped order as delivered.
   */
  @Patch(':id/deliver')
  @ApiOperation({
    summary: 'Mark order as delivered',
  })
  @ApiOkResponse({
    type: OrderResponseDto,
  })
  async deliverOrder(
    @Param('id', new ParseUUIDPipe())
    orderId: string,
  ): Promise<OrderResponseDto> {
    return this.orderService.deliverOrder(orderId);
  }
}
