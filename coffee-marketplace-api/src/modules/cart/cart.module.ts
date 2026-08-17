import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Cart } from './entities/cart.entity';

import { CartItem } from './entities/cart-item.entity';
import { CartRepository } from './repositories/cart.repository';
import { CartItemRepository } from './repositories/cart-item.repository';
import { CartService } from './services/cart.service';
import { CartController } from './controllers/cart.controller';
import { Product } from '../products/entities/product.entity';

/**
 * Cart Module
 *
 * Registers the shopping cart feature:
 * - Cart and CartItem persistence
 * - Cart business rules
 * - Authenticated cart HTTP endpoints
 */
@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem, Product])],

  controllers: [CartController],

  providers: [CartRepository, CartItemRepository, CartService],

  exports: [CartRepository, CartItemRepository, CartService],
})
export class CartModule {}
