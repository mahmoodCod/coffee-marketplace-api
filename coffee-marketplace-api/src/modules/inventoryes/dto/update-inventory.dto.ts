import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsInt, IsOptional, Min } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Update Inventory DTO
 * ------------------------------------------------------------------------
 *
 * Used for updating product inventory.
 *
 * Editable fields:
 *
 * - stock
 * - reservedStock (internal usage only in future)
 *
 * Business Rules:
 *
 * - Stock cannot be negative.
 * ------------------------------------------------------------------------
 */

export class UpdateInventoryDto {
  /**
   * Available product stock.
   *
   * Example:
   *
   * 50 bags of coffee available.
   */
  @ApiPropertyOptional({
    example: 50,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  /**
   * Reserved stock quantity.
   *
   * Used during order processing.
   */
  @ApiPropertyOptional({
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  reservedStock?: number;
}
