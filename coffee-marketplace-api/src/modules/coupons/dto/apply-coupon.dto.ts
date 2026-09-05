import { ApiProperty } from '@nestjs/swagger';

import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Apply Coupon DTO
 * ------------------------------------------------------------------------
 *
 * Request body used by customers when applying
 * a coupon code to an unpaid order.
 * ------------------------------------------------------------------------
 */
export class ApplyCouponDto {
  /**
   * Coupon code entered by the customer.
   */
  @ApiProperty({
    example: 'SUMMER20',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  code: string;
}
