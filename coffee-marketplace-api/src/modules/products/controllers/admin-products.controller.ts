import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

import { RolesGuard } from '../../../common/guards/roles.guard';

import { Roles } from '../../../common/decorators/roles.decorator';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import { ProductResponseDto, UpdateProductDto } from '../dto';

import { ProductService } from '../services/product.service';

/**
 * ------------------------------------------------------------------------
 * Admin Products Controller
 * ------------------------------------------------------------------------
 *
 * Admin product management endpoints.
 *
 * Responsibilities:
 *
 * - View all products
 * - Update any product
 * - Delete any product
 *
 * Security:
 *
 * - JWT Authentication
 * - Admin Role Authorization
 * ------------------------------------------------------------------------
 */

@ApiTags('Admin Products')
@ApiBearerAuth()
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.ADMIN)
export class AdminProductsController {
  constructor(private readonly productService: ProductService) {}

  /**
   * ------------------------------------------------------------------------
   * GET /admin/products
   * ------------------------------------------------------------------------
   *
   * Returns all products for administration.
   * ------------------------------------------------------------------------
   */
  @Get()
  @ApiOperation({
    summary: 'Get all products for admin',
  })
  @ApiOkResponse({
    type: ProductResponseDto,
    isArray: true,
  })
  async findAll() {
    return this.productService.findAllAdmin();
  }

  /**
   * ------------------------------------------------------------------------
   * PATCH /admin/products/:id
   * ------------------------------------------------------------------------
   *
   * Updates any product.
   * ------------------------------------------------------------------------
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update product by admin',
  })
  @ApiOkResponse({
    type: ProductResponseDto,
  })
  async update(
    @Param('id')
    id: string,

    @Body()
    dto: UpdateProductDto,
  ) {
    return this.productService.adminUpdate(id, dto);
  }

  /**
   * ------------------------------------------------------------------------
   * DELETE /admin/products/:id
   * ------------------------------------------------------------------------
   *
   * Deletes any product.
   * ------------------------------------------------------------------------
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product by admin',
  })
  async remove(
    @Param('id')
    id: string,
  ) {
    return this.productService.adminDelete(id);
  }
}
