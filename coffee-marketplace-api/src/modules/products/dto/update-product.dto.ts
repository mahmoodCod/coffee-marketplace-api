import { PartialType } from '@nestjs/swagger';

import { CreateProductDto } from './create-product.dto';

/**
 * ------------------------------------------------------------------------
 * Update Product DTO
 * ------------------------------------------------------------------------
 *
 * Used by:
 *
 * PATCH /seller/products/:id
 *
 * All fields are optional because seller
 * can update only the fields they need.
 * ------------------------------------------------------------------------
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
