import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from './product.entity';
import { Discount } from '../../discounts/entitties/discount.entity';

/**
 * ------------------------------------------------------------------------
 * Product Discount Entity
 * ------------------------------------------------------------------------
 *
 * Represents the many-to-many relationship between products and discounts.
 *
 * A product can have multiple discounts.
 * A discount can be attached to multiple products.
 *
 * The relationship is stored through the product_discounts table.
 *
 * Database Relationship
 * ------------------------------------------------------------------------
 *
 * products.id -> product_discounts.product_id
 *
 * discounts.id -> product_discounts.discount_id
 * ------------------------------------------------------------------------
 */
@Entity({
  name: 'product_discounts',
})
@Unique(['product', 'discount'])
export class ProductDiscount {
  /**
   * Unique identifier.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Product associated with this discount.
   */
  @ManyToOne(() => Product, (product) => product.discounts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'product_id',
  })
  product: Product;

  /**
   * Discount associated with this product.
   */
  @ManyToOne(() => Discount, (discount) => discount.products, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'discount_id',
  })
  discount: Discount;

  /**
   * Creation timestamp.
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  /**
   * Last update timestamp.
   */
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
