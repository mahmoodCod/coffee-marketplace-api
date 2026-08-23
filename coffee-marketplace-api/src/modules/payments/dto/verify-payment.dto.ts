import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Verify Payment DTO
 *
 * Defines the data required to verify
 * a payment result returned by the payment gateway.
 *
 * The payment authority is generated during
 * payment initiation and is later used to
 * identify and verify the payment.
 */
export class VerifyPaymentDto {
  /**
   * Payment authority returned by the payment gateway.
   *
   * This value is used to identify the payment
   * that should be verified.
   */
  @ApiProperty({
    example: 'ABC123456789',
    description: 'Payment gateway authority',
  })
  @IsNotEmpty()
  @IsString()
  authority: string;
}
