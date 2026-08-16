import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';

import { Cart } from './cart.entity';

/**
 * CartItem Entity
 *
 * Represents a single product inside a shopping cart.
 *
 * Business Rules:
 * - A cart item belongs to exactly one cart.
 * - A cart item references exactly one product.
 * - Quantity must be greater than zero.
 * - The same product cannot appear more than once
 *   inside the same cart.
 * - The product price is stored as a snapshot.
 */
@Entity('cart_items')
@Unique('UQ_cart_items_cart_product', ['cart', 'product'])
export class CartItem {
  /**
   * Unique identifier of the cart item.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Number of units of the product
   * requested by the customer.
   */
  @Column({
    type: 'integer',
  })
  quantity: number;

  /**
   * Product price at the time the item
   * was added to the cart.
   *
   * This is stored separately from the current
   * product price so future product price changes
   * do not automatically modify the cart item.
   */
  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  unitPrice: string;

  /**
   * Cart that owns this item.
   */
  @ManyToOne(() => Cart, (cart) => cart.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'cart_id',
  })
  cart: Cart;

  /**
   * Product referenced by this cart item.
   */
  @ManyToOne(() => Product, (product) => product.cartItems, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'product_id',
  })
  product: Product;

  /**
   * Timestamp when the cart item was created.
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  /**
   * Timestamp when the cart item was last updated.
   */
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
