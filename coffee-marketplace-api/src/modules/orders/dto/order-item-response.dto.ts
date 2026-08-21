import { ApiProperty } from '@nestjs/swagger';

/**
 * Order Item Response DTO
 *
 * Represents the public API response
 * for a single order line item.
 *
 * This DTO prevents database entities
 * from being exposed directly through the API.
 */
export class OrderItemResponseDto {
  /**
   * Unique identifier of the order item.
   */
  @ApiProperty({
    example: '7f8c9d10-1234-4567-8901-123456789abc',
  })
  id: string;

  /**
   * ID of the parent order.
   */
  @ApiProperty({
    example: '6f8c9d10-1234-4567-8901-123456789abc',
  })
  orderId: string;

  /**
   * ID of the purchased product.
   */
  @ApiProperty({
    example: '8f9c9d10-1234-4567-8901-123456789abc',
  })
  productId: string;

  /**
   * Quantity of the product in the order.
   */
  @ApiProperty({
    example: 2,
  })
  quantity: number;

  /**
   * Product unit price stored at order creation time.
   */
  @ApiProperty({
    example: '125000.00',
  })
  unitPrice: string;

  /**
   * Timestamp when the order item was created.
   */
  @ApiProperty({
    example: '2026-01-01T10:00:00.000Z',
  })
  createdAt: Date;

  /**
   * Timestamp when the order item was last updated.
   */
  @ApiProperty({
    example: '2026-01-02T12:30:00.000Z',
  })
  updatedAt: Date;
}
