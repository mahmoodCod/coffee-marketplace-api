import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';

/**
 * ------------------------------------------------------------------------
 * Review Entity
 * ------------------------------------------------------------------------
 *
 * Represents a customer's review for a product.
 *
 * Responsibilities:
 *
 * - Store product rating.
 * - Store customer comment.
 * - Track review approval status.
 * - Connect a review to its user.
 * - Connect a review to its product.
 *
 * Business Rules:
 *
 * - A review belongs to one user.
 * - A review belongs to one product.
 * - A user can submit only one review per product.
 * - New reviews are not approved by default.
 * - Only approved reviews are visible publicly.
 * ------------------------------------------------------------------------
 */
@Entity('reviews')
@Index(['user', 'product'], {
  unique: true,
})
export class Review {
  /**
   * Review unique identifier.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * User who created the review.
   *
   * Relationship:
   *
   * User 1 ---- N Review
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
   * Product being reviewed.
   *
   * Relationship:
   *
   * Product 1 ---- N Review
   */
  @ManyToOne(() => Product, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'product_id',
  })
  product: Product;

  /**
   * Product rating submitted by the user.
   *
   * Rating range validation will be handled
   * by the DTO and service layer.
   */
  @Column({
    type: 'integer',
  })
  rating: number;

  /**
   * Indicates whether the review
   * has been approved by an administrator.
   *
   * New reviews are not publicly visible
   * until they are approved.
   */
  @Column({
    name: 'is_approved',
    type: 'boolean',
    default: false,
  })
  isApproved: boolean;

  /**
   * Optional review comment.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  comment: string | null;

  /**
   * Review creation timestamp.
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  /**
   * Review last update timestamp.
   */
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;
}
