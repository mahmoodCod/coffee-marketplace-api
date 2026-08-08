import { ProductCategory } from 'src/modules/products/entities/product-category.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * ------------------------------------------------------------------------
 * Category Entity
 * ------------------------------------------------------------------------
 *
 * Represents a product category in the Coffee Marketplace.
 *
 * Responsibilities:
 * - Organize products into categories.
 * - Support hierarchical categories using parent_id.
 * - Control display order.
 * - Enable or disable categories.
 *
 * Notes:
 * - Category names should be unique.
 * - Category slugs should be unique.
 * - Soft delete is enabled.
 * ------------------------------------------------------------------------
 */

@Entity({
  name: 'categories',
})
export class Category {
  /**
   * Primary UUID identifier.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Category name.
   */
  @Column({
    unique: true,
    length: 100,
  })
  name: string;

  /**
   * URL friendly identifier.
   *
   * Example:
   * coffee-beans
   */
  @Column({
    unique: true,
    length: 120,
  })
  slug: string;

  /**
   * Optional category description.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  /**
   * Parent category UUID.
   *
   * Null means this is a root category.
   */
  @Column({
    name: 'parent_id',
    type: 'uuid',
    nullable: true,
  })
  parentId: string | null;

  /**
   * Display order.
   */
  @Column({
    name: 'sort_order',
    default: 0,
  })
  sortOrder: number;

  /**
   * Indicates whether the category is visible.
   */
  @Column({
    name: 'is_active',
    default: true,
  })
  isActive: boolean;

  /**
   * ------------------------------------------------------------------------
   * Category Products
   * ------------------------------------------------------------------------
   *
   * A category can contain multiple products.
   *
   * Relationship is managed through ProductCategory.
   * ------------------------------------------------------------------------
   */
  @OneToMany(
    () => ProductCategory,
    (productCategory) => productCategory.category,
  )
  products: ProductCategory[];

  /**
   * Record creation timestamp.
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

  /**
   * Soft delete timestamp.
   */
  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt: Date | null;
}
