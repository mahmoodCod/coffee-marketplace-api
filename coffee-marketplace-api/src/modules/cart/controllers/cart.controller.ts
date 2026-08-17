import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CartService } from '../services/cart.service';

import { AddCartItemDto, UpdateCartItemDto } from '../dto';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

/**
 * Cart Controller
 *
 * Handles shopping cart HTTP requests.
 *
 * Responsibilities:
 * - Retrieve the authenticated user's cart.
 * - Add products to the cart.
 * - Update cart item quantities.
 * - Remove cart items.
 * - Clear the active cart.
 *
 * Business logic is delegated to CartService.
 */
@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * GET /cart
   *
   * Returns the authenticated user's active cart.
   *
   * If the user does not have an active cart,
   * CartService creates one.
   */
  @Get()
  @ApiOperation({
    summary: 'Get current user cart',
  })
  async getCart(
    @CurrentUser()
    user: JwtPayload,
  ) {
    return this.cartService.getOrCreateActiveCart(user.sub);
  }

  /**
   * POST /cart/items
   *
   * Adds a product to the authenticated user's cart.
   */
  @Post('items')
  @ApiOperation({
    summary: 'Add product to cart',
  })
  async addItem(
    @CurrentUser()
    user: JwtPayload,

    @Body()
    dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(user.sub, dto);
  }

  /**
   * PATCH /cart/items/:id
   *
   * Updates the quantity of an existing
   * cart item belonging to the authenticated user.
   */
  @Patch('items/:id')
  @ApiOperation({
    summary: 'Update cart item quantity',
  })
  async updateItem(
    @Param('id')
    itemId: string,

    @CurrentUser()
    user: JwtPayload,

    @Body()
    dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.sub, itemId, dto);
  }

  /**
   * DELETE /cart/items/:id
   *
   * Removes a cart item from the authenticated
   * user's active cart.
   */
  @Delete('items/:id')
  @ApiOperation({
    summary: 'Remove cart item',
  })
  async removeItem(
    @Param('id')
    itemId: string,

    @CurrentUser()
    user: JwtPayload,
  ) {
    return this.cartService.removeItem(user.sub, itemId);
  }

  /**
   * DELETE /cart/clear
   *
   * Removes all items from the authenticated
   * user's active cart.
   */
  @Delete('clear')
  @ApiOperation({
    summary: 'Clear current cart',
  })
  async clearCart(
    @CurrentUser()
    user: JwtPayload,
  ) {
    return this.cartService.clearCart(user.sub);
  }
}
