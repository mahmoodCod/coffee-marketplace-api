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

import { CartItem } from './cart-item.entity';

import { CartStatus } from './cart-status.enum';

/**
 * Cart Entity
 *
 * Represents a customer's shopping cart.
 *
 * Business Rules:
 * - A cart belongs to exactly one user.
 * - A user can have multiple historical carts.
 * - A user can have only one ACTIVE cart.
 * - A cart can contain multiple cart items.
 */
@Entity('carts')
@Index('UQ_carts_one_active_per_user', ['user'], {
  unique: true,
  where: `"status" = 'ACTIVE'`,
})
export class Cart {
  /**
   * Unique identifier of the cart.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Current lifecycle status of the cart.
   *
   * The default status is ACTIVE because
   * a newly created cart is immediately usable.
   */
  @Column({
    type: 'enum',
    enum: CartStatus,
    default: CartStatus.ACTIVE,
  })
  status: CartStatus;

  /**
   * User who owns this shopping cart.
   *
   * The relationship is mandatory because
   * every cart must belong to a user.
   */
  @ManyToOne(() => User, (user) => user.carts, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  user: User;

  /**
   * Items contained in this shopping cart.
   *
   * A cart can contain zero or more items.
   */
  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, {
    cascade: true,
  })
  items: CartItem[];

  /**
   * Timestamp when the cart was created.
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  /**
   * Timestamp when the cart was last updated.
   */
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
