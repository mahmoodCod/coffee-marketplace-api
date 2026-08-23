import { ApiProperty } from '@nestjs/swagger';

import { IsUUID, IsUrl } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Create Payment DTO
 * ------------------------------------------------------------------------
 *
 * Defines the data required from the client
 * to initiate a payment for an order.
 *
 * Security Notes:
 *
 * - The client only provides the order ID.
 * - The payment amount is never accepted from the client.
 * - The payment amount is always retrieved from the order
 *   on the server side.
 *
 * This prevents clients from manipulating
 * the payment amount.
 * ------------------------------------------------------------------------
 */
export class CreatePaymentDto {
  /**
   * Unique identifier of the order
   * that the customer wants to pay for.
   */
  @ApiProperty({
    description: 'Unique identifier of the order to be paid.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  orderId: string;

  /**
   * URL where the payment gateway
   * redirects the customer after
   * completing the payment process.
   */
  @ApiProperty({
    description:
      'Callback URL where the payment gateway redirects the customer after payment.',
    example: 'https://example.com/payments/callback',
  })
  @IsUrl()
  callbackUrl: string;
}
