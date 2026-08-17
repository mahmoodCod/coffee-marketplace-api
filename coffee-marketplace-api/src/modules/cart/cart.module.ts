import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Cart } from './entities/cart.entity';

import { CartItem } from './entities/cart-item.entity';

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
  imports: [TypeOrmModule.forFeature([Cart, CartItem])],

  /**
   * Controllers will be added in the controller layer.
   */
  controllers: [],

  /**
   * Services will be added in the service layer.
   */
  providers: [],

  /**
   * Required exports will be added when
   * other modules need Cart functionality.
   */
  exports: [],
})
export class CartModule {}
