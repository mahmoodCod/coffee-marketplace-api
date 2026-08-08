import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

import { CreateProductDto, ProductResponseDto, UpdateProductDto } from '../dto';

import { ProductService } from '../services/product.service';

import { UseGuards } from '@nestjs/common';

/**
 * ------------------------------------------------------------------------
 * Seller Products Controller
 * ------------------------------------------------------------------------
 *
 * Seller-only product management.
 *
 * Responsibilities:
 *
 * - Create products
 * - Update owned products
 * - Delete owned products
 * - View seller products
 *
 * Security:
 *
 * - JWT Authentication
 * - Seller Role Authorization
 * ------------------------------------------------------------------------
 */

@ApiTags('Seller Products')
@ApiBearerAuth()
@Controller('seller/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.SELLER)
export class SellerProductsController {
  constructor(private readonly productService: ProductService) {}

  /**
   * ------------------------------------------------------------------------
   * POST /seller/products
   * ------------------------------------------------------------------------
   *
   * Creates a new product.
   * ------------------------------------------------------------------------
   */
  @Post()
  @ApiOperation({
    summary: 'Create product',
  })
  @ApiOkResponse({
    type: ProductResponseDto,
  })
  async create(
    @CurrentUser()
    currentUser: JwtPayload,

    @Body()
    dto: CreateProductDto,
  ) {
    return this.productService.create(currentUser, dto);
  }

  /**
   * ------------------------------------------------------------------------
   * PATCH /seller/products/:id
   * ------------------------------------------------------------------------
   *
   * Updates seller product.
   * ------------------------------------------------------------------------
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update product',
  })
  @ApiOkResponse({
    type: ProductResponseDto,
  })
  async update(
    @Param('id')
    id: string,

    @CurrentUser()
    currentUser: JwtPayload,

    @Body()
    dto: UpdateProductDto,
  ) {
    return this.productService.update(id, currentUser, dto);
  }

  /**
   * ------------------------------------------------------------------------
   * DELETE /seller/products/:id
   * ------------------------------------------------------------------------
   *
   * Soft deletes seller product.
   * ------------------------------------------------------------------------
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete product',
  })
  async remove(
    @Param('id')
    id: string,

    @CurrentUser()
    currentUser: JwtPayload,
  ) {
    return this.productService.softDelete(id, currentUser);
  }

  /**
   * ------------------------------------------------------------------------
   * GET /seller/products
   * ------------------------------------------------------------------------
   *
   * Returns products owned by seller.
   * ------------------------------------------------------------------------
   */
  @Get()
  @ApiOperation({
    summary: 'Get seller products',
  })
  @ApiOkResponse({
    type: ProductResponseDto,
    isArray: true,
  })
  async findSellerProducts(
    @CurrentUser()
    currentUser: JwtPayload,
  ) {
    return this.productService.findSellerProducts(currentUser.sub);
  }
}
