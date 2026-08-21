import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';

import { Order } from './order.entity';

/**
 * OrderItem Entity
 *
 * Represents a single product line inside an order.
 *
 * Business Rules:
 * - An order item belongs to exactly one order.
 * - An order item references exactly one product.
 * - Quantity must be greater than zero.
 * - The product price is stored as a snapshot.
 */
@Entity('order_items')
export class OrderItem {
  /**
   * Unique identifier of the order item.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Number of product units purchased.
   */
  @Column({
    type: 'integer',
  })
  quantity: number;

  /**
   * Product unit price at the time the order was created.
   *
   * Stored separately from the current product price
   * so future price changes do not affect past orders.
   */
  @Column({
    name: 'unit_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  unitPrice: string;

  /**
   * Order that owns this line item.
   */
  @ManyToOne(() => Order, (order) => order.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'order_id',
  })
  order: Order;

  /**
   * Product referenced by this order item.
   */
  @ManyToOne(() => Product, (product) => product.orderItems, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'product_id',
  })
  product: Product;

  /**
   * Timestamp when the order item was created.
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  /**
   * Timestamp when the order item was last updated.
   */
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
