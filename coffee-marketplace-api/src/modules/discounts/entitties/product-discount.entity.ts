import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Product } from '../../products/entities/product.entity';

import { Discount } from './discount.entity';

/**
 * ------------------------------------------------------------------------
 * Product Discount Entity
 * ------------------------------------------------------------------------
 *
 * Represents the many-to-many relationship between
 * products and discounts.
 *
 * Relationships
 * ------------------------------------------------------------------------
 *
 * Product 1 ---- N ProductDiscount N ---- 1 Discount
 *
 * A product can have multiple discounts.
 * A discount can be attached to multiple products.
 *
 * The relationship is managed through the
 * product_discounts junction table.
 * ------------------------------------------------------------------------
 */
@Entity({
  name: 'product_discounts',
})
export class ProductDiscount {
  /**
   * Product discount unique identifier.
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
