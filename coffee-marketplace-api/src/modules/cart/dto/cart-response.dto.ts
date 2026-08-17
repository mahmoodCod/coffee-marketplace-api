import { ApiProperty } from '@nestjs/swagger';

import { CartStatus } from '../entities/cart-status.enum';

import { CartItemResponseDto } from './cart-item-response.dto';

/**
 * Cart Response DTO
 *
 * Represents the public API response
 * for the customer's shopping cart.
 */
export class CartResponseDto {
  /**
   * Unique identifier of the cart.
   */
  @ApiProperty({
    example: '6f8c9d10-1234-4567-8901-123456789abc',
  })
  id: string;

  /**
   * Current lifecycle status of the cart.
   */
  @ApiProperty({
    enum: CartStatus,
    example: CartStatus.ACTIVE,
  })
  status: CartStatus;

  /**
   * ID of the user who owns the cart.
   */
  @ApiProperty({
    example: '5f8c9d10-1234-4567-8901-123456789abc',
  })
  userId: string;

  /**
   * Products currently contained in the cart.
   */
  @ApiProperty({
    type: () => [CartItemResponseDto],
  })
  items: CartItemResponseDto[];

  /**
   * Timestamp when the cart was created.
   */
  @ApiProperty()
  createdAt: Date;

  /**
   * Timestamp when the cart was last updated.
   */
  @ApiProperty()
  updatedAt: Date;
}
