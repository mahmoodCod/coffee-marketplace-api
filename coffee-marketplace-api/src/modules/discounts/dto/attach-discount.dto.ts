import { IsUUID } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Attach Discount DTO
 * ------------------------------------------------------------------------
 *
 * Defines the request body used when attaching
 * a discount to a seller-owned product.
 * ------------------------------------------------------------------------
 */
export class AttachDiscountDto {
  /**
   * Product that will receive the discount.
   */
  @IsUUID()
  productId: string;
}
