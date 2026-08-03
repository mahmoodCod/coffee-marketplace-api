import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Create Category DTO
 * ------------------------------------------------------------------------
 *
 * Used for creating a new product category.
 * ------------------------------------------------------------------------
 */
export class CreateCategoryDto {
  @ApiProperty({
    example: 'Coffee Beans',
    description: 'Category name',
  })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    example: 'coffee-beans',
    description: 'Unique URL-friendly slug',
  })
  @IsString()
  @Length(2, 120)
  slug: string;

  @ApiPropertyOptional({
    example: 'Premium coffee beans from different origins.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '8f6a84b8-3b8e-4d7d-b6c0-62d31f12a9f0',
    description: 'Parent category UUID',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Display order',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @ApiPropertyOptional({
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
