import { Body, Controller, Param, Patch } from '@nestjs/common';

import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { InventoryService } from '../services/inventory.service';

import { UpdateInventoryDto, InventoryResponseDto } from '../dto';

/**
 * ------------------------------------------------------------------------
 * Admin Inventory Controller
 * ------------------------------------------------------------------------
 *
 * Handles inventory management for administrators.
 *
 * Responsibilities:
 *
 * - Update any product inventory
 *
 * Business Rules:
 *
 * - Admin can manage all product inventories.
 * ------------------------------------------------------------------------
 */

@ApiTags('Admin Inventory')
@Controller('admin/inventory')
export class AdminInventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  /**
   * ------------------------------------------------------------------------
   * PATCH /admin/inventory/:productId
   * ------------------------------------------------------------------------
   *
   * Updates product inventory by admin.
   * ------------------------------------------------------------------------
   */
  @Patch(':productId')
  @ApiOperation({
    summary: 'Update product inventory by admin',
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
