import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsNotEmpty } from 'class-validator';

import { OrderStatus } from '../enums';

/**
 * Update Order Status DTO
 *
 * Defines the request body used when an administrator
 * updates the lifecycle status of an order.
 *
 * Used by:
 * PATCH /admin/orders/:id/status
 */
export class UpdateOrderStatusDto {
  /**
   * New lifecycle status for the order.
   */
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PAID,
    description: 'Target order lifecycle status',
  })
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
