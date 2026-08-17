import { Type } from 'class-transformer';

import { IsInt, Min } from 'class-validator';

/**
 * Update Cart Item DTO
 *
 * Defines the request body used when a customer
 * changes the quantity of an existing cart item.
 *
 * Business Rules:
 * - Quantity must be an integer.
 * - Quantity must be greater than zero.
 * - Setting quantity to zero is not handled here.
 *   Removing an item is done through DELETE /cart/items/:id.
 */
export class UpdateCartItemDto {
  /**
   * New quantity of the cart item.
   */
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;
}
