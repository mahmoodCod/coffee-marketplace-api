import {
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

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

import { OrderResponseDto } from '../dto';

import { OrderService } from '../services/order.service';

/**
 * Seller Orders Controller
 *
 * Handles seller-scoped order endpoints.
 *
 * Responsibilities:
 * - List orders containing the seller's products.
 * - Retrieve a specific seller-owned order.
 * - Confirm receipt of shipped orders.
 *
 * Security:
 * - JWT Authentication
 * - Seller Role Authorization
 */
@ApiTags('Seller Orders')
@ApiBearerAuth()
@Controller('seller/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.SELLER)
export class SellerOrdersController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * GET /seller/orders
   *
   * Returns orders that include products
   * owned by the authenticated seller.
   */
  @Get()
  @ApiOperation({
    summary: 'Get seller orders',
  })
  @ApiOkResponse({
    type: OrderResponseDto,
    isArray: true,
  })
  async getSellerOrders(
    @CurrentUser()
    user: JwtPayload,
  ): Promise<OrderResponseDto[]> {
    return this.orderService.getSellerOrders(user.sub);
  }

  /**
   * GET /seller/orders/:id
   *
   * Returns a specific order that includes
   * products owned by the authenticated seller.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get seller order by ID',
  })
  @ApiOkResponse({
    type: OrderResponseDto,
  })
  async getSellerOrderById(
    @Param('id', new ParseUUIDPipe())
    orderId: string,

    @CurrentUser()
    user: JwtPayload,
  ): Promise<OrderResponseDto> {
    return this.orderService.getSellerOrderById(user.sub, orderId);
  }

  /**
   * PATCH /seller/orders/:id/received
   *
   * Confirms that a shipped order has been
   * received and marks it as delivered.
   */
  @Patch(':id/received')
  @ApiOperation({
    summary: 'Confirm order received',
  })
  @ApiOkResponse({
    type: OrderResponseDto,
  })
  async confirmOrderReceived(
    @Param('id', new ParseUUIDPipe())
    orderId: string,

    @CurrentUser()
    user: JwtPayload,
  ): Promise<OrderResponseDto> {
    return this.orderService.confirmOrderReceived(user.sub, orderId);
  }
}
