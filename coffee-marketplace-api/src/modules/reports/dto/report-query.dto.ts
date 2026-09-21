import { Type } from 'class-transformer';

import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

import { OrderStatus } from '../../orders/enums/order-status.enum';
import { ProductStatus } from '../../products/enums/product-status.enum';
import { UserStatus } from '../../users/enums/user-status.enum';
import {
  SYSTEM_ROLES,
} from '../../../common/constants/system-roles.constant';
import type { SystemRole } from '../../../common/constants/system-roles.constant';

/**
 * Shared pagination and optional date filters for report endpoints.
 */
export class ReportPaginationQueryDto {
  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-01-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Admin/seller order report filters.
 */
export class OrderReportQueryDto extends ReportPaginationQueryDto {
  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

/**
 * Admin product report filters.
 */
export class AdminProductReportQueryDto {
  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

/**
 * Admin user report filters.
 */
export class AdminUserReportQueryDto {
  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    enum: Object.values(SYSTEM_ROLES),
    example: SYSTEM_ROLES.CUSTOMER,
  })
  @IsOptional()
  @IsIn(Object.values(SYSTEM_ROLES))
  role?: SystemRole;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
