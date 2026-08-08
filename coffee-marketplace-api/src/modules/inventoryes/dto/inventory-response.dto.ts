import { ApiProperty } from '@nestjs/swagger';

/**
 * ------------------------------------------------------------------------
 * Inventory Response DTO
 * ------------------------------------------------------------------------
 *
 * Represents inventory information returned from API.
 * ------------------------------------------------------------------------
 */

export class InventoryResponseDto {
  /**
   * Inventory identifier.
   */
  @ApiProperty({
    example: 'uuid',
  })
  id: string;

  /**
   * Related product identifier.
   */
  @ApiProperty({
    example: 'product-uuid',
  })
  productId: string;

  /**
   * Current available stock.
   */
  @ApiProperty({
    example: 100,
  })
  stock: number;

  /**
   * Reserved stock.
   */
  @ApiProperty({
    example: 10,
  })
  reservedStock: number;

  /**
   * Creation date.
   */
  @ApiProperty()
  createdAt: Date;

  /**
   * Last update date.
   */
  @ApiProperty()
  updatedAt: Date;
}
