import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';

import { ProductCategory } from './entities/product-category.entity';

import { ProductService } from './services/product.service';

import { UsersModule } from '../users/users.module';

/**
 * ------------------------------------------------------------------------
 * Product Module
 * ------------------------------------------------------------------------
 *
 * Responsible for:
 *
 * - Product management
 * - Product business logic
 * - Product persistence
 *
 * Current features:
 *
 * - Create product
 * - Update product
 * - Delete product
 * - Retrieve products
 *
 * Future:
 *
 * - Inventory
 * - Product discounts
 * - Reviews
 * ------------------------------------------------------------------------
 */
@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductCategory]), UsersModule],

  providers: [ProductService],

  exports: [ProductService],
})
export class ProductModule {}
