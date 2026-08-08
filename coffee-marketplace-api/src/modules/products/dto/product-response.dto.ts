import { ApiProperty } from '@nestjs/swagger';

import { ProductStatus } from '../enums/product-status.enum';
import { ProductType } from '../enums/product-type.enum';

/**
 * ------------------------------------------------------------------------
 * Product Response DTO
 * ------------------------------------------------------------------------
 *
 * Standard response object returned to clients.
 *
 * Used by:
 *
 * GET /products
 *
 * GET /products/:id
 *
 * GET /seller/products
 * ------------------------------------------------------------------------
 */
export class ProductResponseDto {
  /**
   * Product UUID.
   */
  @ApiProperty()
  id: string;

  /**
   * Product title.
   */
  @ApiProperty()
  title: string;

  /**
   * Product slug.
   */
  @ApiProperty()
  slug: string;

  /**
   * Product description.
   */
  @ApiProperty()
  description: string;

  /**
   * Current price.
   */
  @ApiProperty()
  price: number;

  /**
   * Original price.
   */
  @ApiProperty()
  originalPrice: number;

  /**
   * Product type.
   */
  @ApiProperty({
    enum: ProductType,
  })
  productType: ProductType;

  /**
   * Product status.
   */
  @ApiProperty({
    enum: ProductStatus,
  })
  status: ProductStatus;

  /**
   * Product rating.
   */
  @ApiProperty()
  rating: number;

  /**
   * Total sold count.
   */
  @ApiProperty()
  soldCount: number;

  /**
   * Recommended product.
   */
  @ApiProperty()
  recommended: boolean;

  /**
   * Product creation date.
   */
  @ApiProperty()
  createdAt: Date;

  /**
   * Last update date.
   */
  @ApiProperty()
  updatedAt: Date;
}
