import { Product } from 'src/modules/products/entities/product.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * ------------------------------------------------------------------------
 * Discount Entity
 * ------------------------------------------------------------------------
 *
 * Represents a product discount that can be attached
 * to one or more products through the product_discounts
 * junction table.
 *
 * Business rules:
 * - Only sellers can create discounts.
 * - Sellers can manage discounts attached to their own products.
 * - Admins can view all discounts.
 * - Only active discounts within their valid date range can be applied.
 * - Expired discounts cannot be applied.
 * - A discount must not reduce the product price below zero.
 * ------------------------------------------------------------------------
 */
@Entity('discounts')
export class Discount {
  /**
   * Unique identifier of the discount.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Display name of the discount.
   */
  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  /**
   * Discount calculation type.
   *
   * The exact supported values are defined separately
   * by the discount type enum/business rules.
   */
  @Column({
    type: 'varchar',
    length: 50,
  })
  type: string;

  /**
   * Discount value.
   *
   * The meaning of this value depends on the discount type.
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  value: string;

  /**
   * Optional description of the discount.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  /**
   * Minimum order amount required
   * for the discount to be applicable.
   */
  @Column({
    name: 'minimum_order_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  minimumOrderAmount: string | null;

  /**
   * Maximum amount that can be discounted.
   */
  @Column({
    name: 'maximum_discount_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  maximumDiscountAmount: string | null;

  /**
   * Maximum number of times the discount can be used.
   *
   * Null means no usage limit.
   */
  @Column({
    name: 'usage_limit',
    type: 'int',
    nullable: true,
  })
  usageLimit: number | null;

  /**
   * Number of times the discount has already been used.
   */
  @Column({
    name: 'used_count',
    type: 'int',
    default: 0,
  })
  usedCount: number;

  /**
   * Determines whether the discount is currently enabled.
   */
  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  /**
   * Date from which the discount becomes valid.
   */
  @Column({
    name: 'start_date',
    type: 'timestamp',
  })
  startDate: Date;

  /**
   * Date after which the discount is considered expired.
   */
  @Column({
    name: 'end_date',
    type: 'timestamp',
  })
  endDate: Date;

  @ManyToMany(() => Product)
  products: Product[];
  /**
   * Discount creation timestamp.
   */
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  /**
   * Discount last update timestamp.
   */
  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;
}
