import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';

import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

/**
 * Add Cart Item DTO
 *
 * Defines the request body used when a customer
 * adds a product to their shopping cart.
 *
 * Business Rules:
 * - Product ID must be a valid UUID.
 * - Quantity must be an integer.
 * - Quantity must be greater than zero.
 */
export class AddCartItemDto {
  /**
   * ID of the product that should be added to the cart.
   */
  @ApiProperty({
    example: '8f9c9d10-1234-4567-8901-123456789abc',
    description: 'UUID of the product to add to the cart',
  })
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  /**
   * Number of product units requested by the customer.
   *
   * The minimum allowed quantity is 1.
   */
  @ApiProperty({
    example: 2,
    description: 'Number of product units to add',
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}
