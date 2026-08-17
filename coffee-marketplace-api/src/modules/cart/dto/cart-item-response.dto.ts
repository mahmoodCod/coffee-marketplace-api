import { ApiProperty } from '@nestjs/swagger';

/**
 * Cart Item Response DTO
 *
 * Represents the public API response
 * for a single cart item.
 *
 * This DTO prevents database entities
 * from being exposed directly through the API.
 */
export class CartItemResponseDto {
  /**
   * Unique identifier of the cart item.
   */
  @ApiProperty({
    example: '7f8c9d10-1234-4567-8901-123456789abc',
  })
  id: string;

  /**
   * ID of the product.
   */
  @ApiProperty({
    example: '8f9c9d10-1234-4567-8901-123456789abc',
  })
  productId: string;

  /**
   * Quantity of the product in the cart.
   */
  @ApiProperty({
    example: 2,
  })
  quantity: number;

  /**
   * Product unit price stored in the cart.
   */
  @ApiProperty({
    example: '125000.00',
  })
  unitPrice: string;

  /**
   * Timestamp when the cart item was created.
   */
  @ApiProperty()
  createdAt: Date;

  /**
   * Timestamp when the cart item was last updated.
   */
  @ApiProperty()
  updatedAt: Date;
}
