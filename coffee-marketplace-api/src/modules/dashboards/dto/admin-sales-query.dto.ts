import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsDateString, IsIn, IsOptional } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Admin Sales Query DTO
 * ------------------------------------------------------------------------
 *
 * Validates optional filters for admin sales analytics.
 * ------------------------------------------------------------------------
 */
export class AdminSalesQueryDto {
  /**
   * Inclusive start date for the sales period.
   */
  @ApiPropertyOptional({
    example: '2026-08-01',
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  /**
   * Inclusive end date for the sales period.
   */
  @ApiPropertyOptional({
    example: '2026-08-31',
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  /**
   * Aggregation bucket for sales analytics.
   */
  @ApiPropertyOptional({
    enum: ['day', 'month'],
    example: 'day',
    default: 'day',
  })
  @IsOptional()
  @IsIn(['day', 'month'])
  groupBy?: 'day' | 'month';
}
