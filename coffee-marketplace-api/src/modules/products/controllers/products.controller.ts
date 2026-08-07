import { Controller, Get, Param } from '@nestjs/common';

import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ProductResponseDto } from '../dto';

import { ProductService } from '../services/product.service';

/**
 * ------------------------------------------------------------------------
 * Products Controller
 * ------------------------------------------------------------------------
 *
 * Public product endpoints.
 *
 * Responsibilities:
 *
 * - Product listing
 * - Product details
 *
 * Authentication:
 *
 * No JWT required for browsing products.
 *
 * Purchase authentication is handled
 * in Cart / Order modules.
 * ------------------------------------------------------------------------
 */

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productService: ProductService) {}

  /**
   * ------------------------------------------------------------------------
   * GET /products
   * ------------------------------------------------------------------------
   *
   * Returns available products.
   * ------------------------------------------------------------------------
   */
  @Get()
  @ApiOperation({
    summary: 'Get all products',
  })
  @ApiOkResponse({
    type: ProductResponseDto,
    isArray: true,
  })
  async findAll() {
    return this.productService.findAll();
  }

  /**
   * ------------------------------------------------------------------------
   * GET /products/:id
   * ------------------------------------------------------------------------
   *
   * Returns product details.
   * ------------------------------------------------------------------------
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get product details',
  })
  @ApiOkResponse({
    type: ProductResponseDto,
  })
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }
}
