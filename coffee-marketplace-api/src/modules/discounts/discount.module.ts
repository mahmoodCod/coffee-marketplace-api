import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Discount } from './entitties/discount.entity';

import { ProductDiscount } from './entitties/product-discount.entity';

import { DiscountService } from './services/discount.service';

import { DiscountRepository } from './repositories/discount.repository';

import { ProductDiscountRepository } from './repositories/product-discount.repository';

import { AdminDiscountController } from './controllers/admin-discount.controller';

import { SellerDiscountController } from './controllers/seller-discount.controller';

import { ProductModule } from '../products/products.module';

/**
 * ------------------------------------------------------------------------
 * Discount Module
 * ------------------------------------------------------------------------
 *
 * Responsible for:
 *
 * - Creating product discounts
 * - Updating product discounts
 * - Deleting product discounts
 * - Listing seller product discounts
 * - Attaching discounts to seller products
 * - Viewing all product discounts by admins
 *
 * Database entities:
 *
 * - Discount
 * - ProductDiscount
 *
 * The ProductModule is imported because DiscountService
 * uses ProductService to verify product ownership.
 * ------------------------------------------------------------------------
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Discount, ProductDiscount]),

    ProductModule,
  ],

  controllers: [AdminDiscountController, SellerDiscountController],

  providers: [DiscountRepository, ProductDiscountRepository, DiscountService],

  exports: [DiscountService],
})
export class DiscountModule {}
