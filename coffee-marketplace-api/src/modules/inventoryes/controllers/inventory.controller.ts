import { Controller, Get, Param } from '@nestjs/common';

import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { InventoryService } from '../services/inventory.service';

import { InventoryResponseDto } from '../dto';

/**
 * ------------------------------------------------------------------------
 * Inventory Controller
 * ------------------------------------------------------------------------
 *
 * Handles public inventory queries.
 *
 * ------------------------------------------------------------------------
 */

@ApiTags('Inventory')
@Controller('products')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * ------------------------------------------------------------------------
   * GET /products/:productId/inventory
   * ------------------------------------------------------------------------
   *
   * Returns product inventory information.
   * ------------------------------------------------------------------------
   */
  @Get(':productId/inventory')
  @ApiOperation({
    summary: 'Get product inventory',
  })
  @ApiOkResponse({
    type: InventoryResponseDto,
  })
  async getInventory(
    @Param('productId')
    productId: string,
  ): Promise<InventoryResponseDto> {
    return this.inventoryService.getPublicInventory(productId);
  }
}
