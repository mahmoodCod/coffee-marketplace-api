import { IsString, MaxLength, MinLength } from 'class-validator';

export class ApplyCouponDto {
  /**
   * Coupon code entered by the customer.
   */
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  code: string;
}
