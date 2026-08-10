import { Body, Controller, Param, Patch } from '@nestjs/common';

import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { InventoryService } from '../services/inventory.service';

import { InventoryResponseDto, UpdateInventoryDto } from '../dto';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

/**
 * --------------------------------------------------------------------------
 * Seller Inventory Controller
 * --------------------------------------------------------------------------
 *
 * Handles inventory operations for sellers.
 *
 * Responsibilities:
 *
 * - Update product stock.
 * - Ensure the authenticated seller can only
 *   manage inventory of their own products.
 *
 * Business Rules:
 *
 * - Seller must be authenticated.
 * - Seller can only update inventory for products
 *   that belong to them.
 *
 * --------------------------------------------------------------------------
 */
@ApiTags('Seller Inventory')
@Controller('seller/inventory')
export class SellerInventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * ------------------------------------------------------------------------
   * PATCH /seller/inventory/:productId
   * ------------------------------------------------------------------------
   *
   * Updates the inventory of a product owned
   * by the authenticated seller.
   *
   * The seller ID is extracted from the JWT payload
   * and passed to the service.
   *
   * The service is responsible for verifying
   * product ownership before updating inventory.
   * ------------------------------------------------------------------------
   */
  @Patch(':productId')
  @ApiOperation({
    summary: 'Update seller product inventory',
  })
  @ApiOkResponse({
    type: InventoryResponseDto,
  })
  async updateInventory(
    @Param('productId')
    productId: string,

    /**
     * Get the currently authenticated user
     * from the JWT payload.
     */
    @CurrentUser()
    user: JwtPayload,

    @Body()
    dto: UpdateInventoryDto,
  ): Promise<InventoryResponseDto> {
    /**
     * Pass both product ID and seller ID
     * to the service.
     *
     * The service verifies that the product
     * belongs to this seller before updating
     * the inventory.
     */
    return this.inventoryService.updateSellerInventory(
      productId,
      user.sub,
      dto,
    );
  }
}
