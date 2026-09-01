import {
  Body,
  Controller,
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
@ApiBearerAuth()
@Controller('admin/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.ADMIN)
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
    @Param('productId', new ParseUUIDPipe()) productId: string,

    @Body()
    dto: UpdateInventoryDto,
  ): Promise<InventoryResponseDto> {
    return this.inventoryService.updateInventory(
      productId,

      dto,
    );
  }
}
