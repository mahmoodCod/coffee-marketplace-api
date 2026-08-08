import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { ProductStatus } from '../enums/product-status.enum';
import { ProductType } from '../enums/product-type.enum';

/**
 * ------------------------------------------------------------------------
 * Create Product DTO
 * ------------------------------------------------------------------------
 *
 * Used by:
 *
 * POST /seller/products
 *
 * Only sellers can create products.
 * ------------------------------------------------------------------------
 */
export class CreateProductDto {
  /**
   * Product title.
   */
  @ApiProperty({
    example: 'Colombian Arabica Coffee',
  })
  @IsString()
  @MaxLength(150)
  title: string;

  /**
   * SEO slug.
   */
  @ApiProperty({
    example: 'colombian-arabica-coffee',
  })
  @IsString()
  slug: string;

  /**
   * Product description.
   */
  @ApiProperty()
  @IsString()
  description: string;

  /**
   * Product price.
   */
  @ApiProperty({
    example: 350000,
  })
  @IsNumber()
  @Min(1)
  price: number;

  /**
   * Original price.
   */
  @ApiProperty({
    example: 400000,
  })
  @IsNumber()
  @Min(1)
  originalPrice: number;

  /**
   * Product type.
   */
  @ApiProperty({
    enum: ProductType,
  })
  @IsEnum(ProductType)
  productType: ProductType;

  /**
   * Product weight.
   */
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsNumber()
  weight?: number;

  /**
   * Country of origin.
   */
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  originCountry?: string;

  /**
   * Warranty.
   */
  @ApiProperty({
    default: false,
  })
  @IsBoolean()
  hasWarranty: boolean;

  /**
   * Warranty description.
   */
  @ApiProperty({
    required: false,
  })
  @IsOptional()
  @IsString()
  warrantyDescription?: string;

  /**
   * Product status.
   */
  @ApiProperty({
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
