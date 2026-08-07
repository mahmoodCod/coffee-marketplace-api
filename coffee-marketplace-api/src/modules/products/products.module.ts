import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';

import { ProductCategory } from './entities/product-category.entity';

import { ProductService } from './services/product.service';

import { UsersModule } from '../users/users.module';
import { ProductsController } from './controllers/products.controller';
import { SellerProductsController } from './controllers/seller-products.controller';
import { AdminProductsController } from './controllers/admin-products.controller';

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

  controllers: [
    ProductsController,

    SellerProductsController,

    AdminProductsController,
  ],

  providers: [ProductService],

  exports: [ProductService],
})
export class ProductModule {}
