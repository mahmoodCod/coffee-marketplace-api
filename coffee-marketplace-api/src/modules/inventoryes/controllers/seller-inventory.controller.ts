import { Body, Controller, Param, Patch } from '@nestjs/common';

import { ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';

import { InventoryService } from '../services/inventory.service';

import { UpdateInventoryDto } from '../dto';

import { InventoryResponseDto } from '../dto';

/**
 * ------------------------------------------------------------------------
 * Seller Inventory Controller
 * ------------------------------------------------------------------------
 *
 * Handles inventory operations for sellers.
 *
 * Responsibilities:
 *
 * - Update product stock
 *
 * Business Rules:
 *
 * - Seller can manage inventory of own products.
 * ------------------------------------------------------------------------
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
   * Updates product inventory.
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

    @Body()
    dto: UpdateInventoryDto,
  ): Promise<InventoryResponseDto> {
    return this.inventoryService.updateInventory(
      productId,

      dto,
    );
  }
}
