import { Order } from '../../../modules/orders/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * ------------------------------------------------------------------------
 * Coupon Entity
 * ------------------------------------------------------------------------
 *
 * Represents an order-level discount coupon managed by administrators.
 *
 * Business rules:
 * - Only admins can create and manage coupons.
 * - Coupon codes must be unique.
 * - Only active and non-expired coupons can be applied.
 * - A coupon can be applied to multiple orders.
 * - An order can have at most one coupon.
 * - Coupon usage is counted only after successful payment.
 * - A coupon must not reduce the final order price below zero.
 * ------------------------------------------------------------------------
 */
@Entity('coupons')
@Index(['isActive', 'expiresAt'])
export class Coupon {
  /**
   * Unique identifier of the coupon.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Unique coupon code entered by customers.
   */
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  code: string;

  /**
   * Display name of the coupon.
   */
  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

  /**
   * Coupon calculation type.
   *
   * Expected values:
   * - PERCENTAGE
   * - FIXED
   */
  @Column({
    type: 'varchar',
    length: 50,
  })
  type: string;

  /**
   * Coupon discount value.
   *
   * For percentage coupons, this represents a value
   * between 0 and 100.
   *
   * For fixed coupons, this represents a monetary amount.
   */
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  value: string;

  /**
   * Optional description of the coupon.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  description: string | null;

  /**
   * Minimum order amount required
   * for the coupon to be applicable.
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
   * Maximum discount amount allowed.
   *
   * This value is mainly used to cap percentage-based coupons.
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
   * Maximum number of times the coupon can be used.
   *
   * Null means unlimited usage.
   */
  @Column({
    name: 'usage_limit',
    type: 'int',
    nullable: true,
  })
  usageLimit: number | null;

  /**
   * Number of successful payments
   * that have used this coupon.
   */
  @Column({
    name: 'used_count',
    type: 'int',
    default: 0,
  })
  usedCount: number;

  /**
   * Determines whether the coupon is currently enabled.
   */
  @Column({
    name: 'is_active',
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  /**
   * Timestamp after which the coupon can no longer be applied.
   */
  @Column({
    name: 'expires_at',
    type: 'timestamp',
  })
  expiresAt: Date;

  /**
   * Orders that have this coupon applied.
   */
  @OneToMany(() => Order, (order) => order.coupon)
  orders: Order[];

  /**
   * Coupon creation timestamp.
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  /**
   * Coupon last update timestamp.
   */
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
