import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Discount } from './entities/discount.entity';

import { ProductDiscount } from '../products/entities/product-discount.entity';

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
 * Responsible for product discount management.
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
