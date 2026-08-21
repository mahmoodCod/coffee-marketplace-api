import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsUUID } from 'class-validator';

/**
 * Create Order DTO
 *
 * Defines the request body used when a customer
 * creates an order from their active cart.
 *
 * Business Rules:
 * - Shipping address ID must be a valid UUID.
 * - The address must belong to the authenticated user.
 * - Order items are taken from the active cart.
 */
export class CreateOrderDto {
  /**
   * ID of the shipping address selected for this order.
   */
  @ApiProperty({
    example: '4f8c9d10-1234-4567-8901-123456789abc',
    description: 'UUID of the customer shipping address',
  })
  @IsNotEmpty()
  @IsUUID()
  shippingAddressId: string;
}
