import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { OrderStatus } from '../enums';

import { OrderItemResponseDto } from './order-item-response.dto';

/**
 * Order Response DTO
 *
 * Represents the public API response
 * for a customer order.
 *
 * This DTO prevents database entities
 * from being exposed directly through the API.
 */
export class OrderResponseDto {
  /**
   * Unique identifier of the order.
   */
  @ApiProperty({
    example: '6f8c9d10-1234-4567-8901-123456789abc',
  })
  id: string;

  /**
   * Current lifecycle status of the order.
   */
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PENDING_PAYMENT,
  })
  status: OrderStatus;

  /**
   * ID of the user who placed the order.
   */
  @ApiProperty({
    example: '5f8c9d10-1234-4567-8901-123456789abc',
  })
  userId: string;

  /**
   * ID of the shipping address selected for this order.
   */
  @ApiProperty({
    example: '4f8c9d10-1234-4567-8901-123456789abc',
  })
  shippingAddressId: string;

  /**
   * Sum of all order item prices before discounts.
   */
  @ApiProperty({
    example: '250000.00',
  })
  totalPrice: string;

  /**
   * Final amount payable after coupon discounts.
   */
  @ApiProperty({
    example: '225000.00',
  })
  finalPrice: string;

  /**
   * Optional coupon applied to this order.
   */
  @ApiPropertyOptional({
    example: '9f8c9d10-1234-4567-8901-123456789abc',
    nullable: true,
  })
  couponId: string | null;

  /**
   * Shipment tracking code assigned by an administrator.
   */
  @ApiPropertyOptional({
    example: 'TRK-123456789',
    nullable: true,
  })
  trackingCode: string | null;

  /**
   * Timestamp when payment was completed.
   */
  @ApiPropertyOptional({
    example: '2026-01-02T11:00:00.000Z',
    nullable: true,
  })
  paidAt: Date | null;

  /**
   * Timestamp when the order was shipped.
   */
  @ApiPropertyOptional({
    example: '2026-01-03T09:00:00.000Z',
    nullable: true,
  })
  shippedAt: Date | null;

  /**
   * Timestamp when the order was delivered.
   */
  @ApiPropertyOptional({
    example: '2026-01-05T14:00:00.000Z',
    nullable: true,
  })
  deliveredAt: Date | null;

  /**
   * Products included in this order.
   */
  @ApiProperty({
    type: () => [OrderItemResponseDto],
  })
  items: OrderItemResponseDto[];

  /**
   * Timestamp when the order was created.
   */
  @ApiProperty({
    example: '2026-01-01T10:00:00.000Z',
  })
  createdAt: Date;

  /**
   * Timestamp when the order was last updated.
   */
  @ApiProperty({
    example: '2026-01-02T12:30:00.000Z',
  })
  updatedAt: Date;
}
