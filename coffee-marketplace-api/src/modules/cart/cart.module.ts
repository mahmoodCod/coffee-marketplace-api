import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Cart } from './entities/cart.entity';

import { CartItem } from './entities/cart-item.entity';
import { CartRepository } from './repositories/cart.repository';
import { CartItemRepository } from './repositories/cart-item.repository';
import { CartService } from './services/cart.service';
import { Product } from '../products/entities/product.entity';

/**
 * Cart Module
 *
 * Provides the infrastructure required
 * for the shopping cart feature.
 *
 * Responsibilities of this module will include:
 * - Cart management
 * - Cart item management
 * - Quantity management
 * - Cart validation
 */
@Module({
  /**
   * Register Cart and CartItem repositories
   * so they can be injected into services.
   */
  imports: [TypeOrmModule.forFeature([Cart, CartItem, Product])],

  /**
   * Controllers will be added in the controller layer.
   */
  controllers: [],

  /**
   * Services will be added in the service layer.
   */
  providers: [CartRepository, CartItemRepository, CartService],

  /**
   * Required exports will be added when
   * other modules need Cart functionality.
   */
  exports: [CartRepository, CartItemRepository, CartService],
})
export class CartModule {}
