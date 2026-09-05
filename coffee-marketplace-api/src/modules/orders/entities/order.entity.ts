import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';

import { Address } from '../../users/entities/address.entity';
import { User } from '../../users/entities/user.entity';

import { OrderStatus } from '../enums';

import { OrderItem } from './order-item.entity';
import { Payment } from '../../../modules/payments/entities/payment.entity';
import { Coupon } from '../../../modules/coupons/entities/coupon.entity';

/**
 * Order Entity
 *
 * Represents a customer purchase created from an active cart.
 *
 * Business Rules:
 * - An order belongs to exactly one user.
 * - An order must include a shipping address.
 * - An order contains one or more order items.
 * - Inventory decreases only after successful payment.
 * - Orders cannot be cancelled after shipment.
 */
@Entity('orders')
export class Order {
  /**
   * Unique identifier of the order.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Current lifecycle status of the order.
   *
   * New orders start as PENDING_PAYMENT until
   * the customer completes payment.
   */
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING_PAYMENT,
  })
  status: OrderStatus;

  /**
   * Sum of all order item prices before discounts.
   */
  @Column({
    name: 'total_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  totalPrice: string;

  /**
   * Final amount payable after coupon discounts.
   */
  @Column({
    name: 'final_price',
    type: 'decimal',
    precision: 12,
    scale: 2,
  })
  finalPrice: string;

  /**
   * Optional coupon applied to this order.
   *
   * An order can have at most one coupon.
   */
  @ManyToOne(() => Coupon, (coupon) => coupon.orders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'coupon_id',
  })
  coupon: Coupon | null;

  /**
   * Foreign key of the applied coupon.
   *
   * Mapped from coupon_id so order responses can
   * expose couponId without loading the coupon relation.
   */
  @RelationId((order: Order) => order.coupon)
  couponId: string | null;

  /**
   * Shipment tracking code assigned by an administrator.
   */
  @Column({
    name: 'tracking_code',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  trackingCode: string | null;

  /**
   * Timestamp when payment was completed.
   */
  @Column({
    name: 'paid_at',
    type: 'timestamp',
    nullable: true,
  })
  paidAt: Date | null;

  /**
   * Timestamp when the order was shipped.
   */
  @Column({
    name: 'shipped_at',
    type: 'timestamp',
    nullable: true,
  })
  shippedAt: Date | null;

  /**
   * Timestamp when the order was delivered.
   */
  @Column({
    name: 'delivered_at',
    type: 'timestamp',
    nullable: true,
  })
  deliveredAt: Date | null;

  /**
   * Customer who placed this order.
   */
  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user: User;

  /**
   * Delivery address selected for this order.
   */
  @ManyToOne(() => Address, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'shipping_address_id',
  })
  shippingAddress: Address;

  /**
   * Products included in this order.
   */
  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, {
    cascade: true,
  })
  items: OrderItem[];

  /**
   * Payment associated with this order.
   *
   * An order can have at most one payment record.
   */
  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment;

  /**
   * Timestamp when the order was created.
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  /**
   * Timestamp when the order was last updated.
   */
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
