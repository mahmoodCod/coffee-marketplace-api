import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ------------------------------------------------------------------------
 * Discount Response DTO
 * ------------------------------------------------------------------------
 *
 * Defines the public API representation of a discount.
 * ------------------------------------------------------------------------
 */
export class DiscountResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  value: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  minimumOrderAmount: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  maximumDiscountAmount: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  usageLimit: number | null;

  @ApiProperty()
  usedCount: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
