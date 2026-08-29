import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

import { ProductDiscount } from '../../products/entities/product-discount.entity';

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
 * - Sellers can manage only their own discounts.
 * - Admins can view all discounts.
 * - Only active discounts within their valid date range can be applied.
 * - Expired discounts cannot be applied.
 * - A discount must not reduce the product price below zero.
 * ------------------------------------------------------------------------
 */
@Entity('discounts')
@Index(['isActive', 'endDate'])
export class Discount {
  /**
   * Unique identifier of the discount.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Seller that created this discount.
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
   * Display name of the discount.
   */
  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  /**
   * Discount calculation type.
   */
  @Column({
    type: 'varchar',
    length: 50,
  })
  type: string;

  /**
   * Discount value.
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

  /**
   * Product assignments for this discount.
   */
  @OneToMany(
    () => ProductDiscount,
    (productDiscount) => productDiscount.discount,
  )
  products: ProductDiscount[];

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
