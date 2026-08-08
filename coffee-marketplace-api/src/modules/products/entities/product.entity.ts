import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { ProductStatus, ProductType } from '../enums';
import { ProductCategory } from './product-category.entity';
import { Inventory } from 'src/modules/inventoryes/entities/inventory.entity';

/**
 * ------------------------------------------------------------------------
 * Product Entity
 * ------------------------------------------------------------------------
 *
 * Represents a product listed by a seller.
 *
 * Business Rules
 * ------------------------------------------------------------------------
 * - Every product belongs to exactly one seller.
 * - Every product must later belong to at least one category.
 * - Product inventory is managed separately.
 * - Reviews are stored separately.
 * - Discounts are stored separately.
 *
 * Notes
 * ------------------------------------------------------------------------
 * Categories are NOT stored here because the relationship
 * is many-to-many and handled by ProductCategory.
 * ------------------------------------------------------------------------
 */
@Entity({
  name: 'products',
})
export class Product {
  /**
   * Product unique identifier.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Seller that owns this product.
   */
  @ManyToOne(() => User, {
    nullable: false,

    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'seller_id',
  })
  seller: User;

  /**
   * Product title.
   */
  @Column({
    type: 'varchar',
    length: 150,
  })
  title: string;

  /**
   * SEO friendly slug.
   */
  @Column({
    unique: true,
    length: 180,
    type: 'varchar',
  })
  slug: string;

  /**
   * Product description.
   */
  @Column({
    type: 'text',
  })
  description: string;

  /**
   * Final selling price.
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  price: number;

  /**
   * Original price before discount.
   */
  @Column({
    name: 'original_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  originalPrice: number;

  /**
   * Product type.
   *
   * Will become Enum later.
   */
  @Column({
    name: 'product_type',
    type: 'enum',
    enum: ProductType,
  })
  productType: ProductType;

  /**
   * Product weight (grams).
   */
  @Column({
    type: 'integer',
    nullable: true,
  })
  weight: number | null;

  /**
   * Caffeine level.
   */
  @Column({
    name: 'caffeine_level',
    nullable: true,
    type: 'varchar',
    length: 50,
  })
  caffeineLevel: string | null;

  /**
   * Flavor notes.
   */
  @Column({
    name: 'flavor_notes',
    type: 'text',
    nullable: true,
  })
  flavorNotes: string | null;

  /**
   * Country of origin.
   */
  @Column({
    name: 'origin_country',
    nullable: true,
    type: 'varchar',
    length: 100,
  })
  originCountry: string | null;

  /**
   * Product ingredients.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  ingredients: string | null;

  /**
   * Product benefits.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  benefits: string | null;

  /**
   * Usage instructions.
   */
  @Column({
    name: 'how_to_use',
    type: 'text',
    nullable: true,
  })
  howToUse: string | null;

  /**
   * Warranty availability.
   */
  @Column({
    name: 'has_warranty',
    type: 'boolean',
    default: false,
  })
  hasWarranty: boolean;

  /**
   * Warranty description.
   */
  @Column({
    name: 'warranty_description',
    type: 'text',
    nullable: true,
  })
  warrantyDescription: string | null;

  /**
   * Average rating.
   *
   * Updated from reviews.
   */
  @Column({
    type: 'decimal',
    default: 0,
  })
  rating: number;

  /**
   * Number of sold items.
   */
  @Column({
    name: 'sold_count',
    type: 'integer',
    default: 0,
  })
  soldCount: number;

  /**
   * Recommended product.
   */
  @Column({
    default: false,
  })
  recommended: boolean;

  /**
   * Product status.
   *
   * Will become Enum later.
   */
  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  /**
   * ------------------------------------------------------------------------
   * Product Categories
   * ------------------------------------------------------------------------
   *
   * A product can belong to multiple categories.
   *
   * Relationship is managed through ProductCategory.
   * ------------------------------------------------------------------------
   */
  @OneToMany(
    () => ProductCategory,
    (productCategory) => productCategory.product,
  )
  categories: ProductCategory[];

  /**
   * Product inventory.
   *
   * Relationship:
   *
   * One product has one inventory.
   */
  @OneToOne(() => Inventory, (inventory) => inventory.product)
  inventory: Inventory;

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

  /**
   * Soft delete timestamp.
   */
  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt: Date | null;
}
