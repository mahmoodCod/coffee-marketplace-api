import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PaymentStatus } from '../enums/payment-status.enum';

/**
 * Payment Response DTO
 *
 * Represents the payment data returned
 * from the API.
 *
 * This DTO prevents the Payment entity
 * from being exposed directly.
 */
export class PaymentResponseDto {
  /**
   * Unique identifier of the payment.
   */
  @ApiProperty({
    example: '7f8c9d10-1234-4567-8901-123456789abc',
  })
  id: string;

  /**
   * ID of the order associated with this payment.
   */
  @ApiProperty({
    example: '6f8c9d10-1234-4567-8901-123456789abc',
  })
  orderId: string;

  /**
   * Payment gateway authority.
   */
  @ApiPropertyOptional({
    nullable: true,
    description: 'Payment gateway authority',
    example: '1234567890',
  })
  authority: string | null;

  /**
   * Transaction identifier returned after
   * a successful payment.
   */
  @ApiPropertyOptional({
    nullable: true,
    description: 'Payment transaction ID',
    example: 'TXN-1234567890',
  })
  transactionId: string | null;

  /**
   * Payment amount.
   */
  @ApiProperty({
    description: 'Payment amount',
    example: '100.00',
  })
  amount: string;

  /**
   * Current payment lifecycle status.
   */
  @ApiProperty({
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  /**
   * Timestamp when the payment was successfully completed.
   */
  @ApiPropertyOptional({
    nullable: true,
    example: '2026-01-01T00:00:00.000Z',
  })
  paidAt: Date | null;

  /**
   * Timestamp when the payment record was created.
   */
  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  /**
   * Timestamp when the payment record was last updated.
   */
  @ApiProperty({
    example: '2026-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
