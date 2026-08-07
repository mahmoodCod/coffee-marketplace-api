import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Product } from './product.entity';

import { Category } from '../../categories/entities/category.entity';

/**
 * ------------------------------------------------------------------------
 * ProductCategory Entity
 * ------------------------------------------------------------------------
 *
 * Pivot entity between Product and Category.
 *
 * Relationship:
 *
 * Product  <---->  Category
 *
 * A product can belong to multiple categories.
 * A category can contain multiple products.
 *
 * This entity represents:
 *
 * product_categories table
 *
 * ------------------------------------------------------------------------
 */
@Entity({
  name: 'product_categories',
})
export class ProductCategory {
  /**
   * Product identifier.
   *
   * Part of composite primary key.
   */
  @PrimaryColumn({
    name: 'product_id',
    type: 'uuid',
  })
  productId: string;

  /**
   * Category identifier.
   *
   * Part of composite primary key.
   */
  @PrimaryColumn({
    name: 'category_id',
    type: 'uuid',
  })
  categoryId: string;

  /**
   * Related product.
   */
  @ManyToOne(() => Product, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'product_id',
  })
  product: Product;

  /**
   * Related category.
   */
  @ManyToOne(() => Category, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'category_id',
  })
  category: Category;
}
