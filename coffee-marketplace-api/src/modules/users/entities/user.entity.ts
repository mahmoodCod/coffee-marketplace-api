import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Role } from '../../roles/entities/role.entity';
import { UserStatus } from '../enums/user-status.enum';
import { Address } from './address.entity';
import { Cart } from '../../../modules/cart/entities';
import { Review } from '../../../modules/reviews/entities/review.entity';
import { Notification } from '../../../modules/notifications/entities/notification.entity';
import { Article } from 'src/modules/articles/entities/article.entity';

/**
 * ------------------------------------------------------------------------
 * User Entity
 * ------------------------------------------------------------------------
 *
 * Represents every authenticated person in the Coffee Marketplace.
 *
 * Responsibilities:
 * - Stores identity (phone, optional display name)
 * - Stores account status
 * - Links the user to exactly one Role
 *
 * Authentication:
 * Users authenticate with mobile phone OTP (handled by Auth module).
 *
 * Notes:
 * - Phone numbers are stored in E.164 without "+" (e.g. 989123456789)
 * - Soft delete is enabled via deleted_at
 *
 * Relationships:
 * - User → Role (ManyToOne)
 * - User → Addresses (OneToMany)
 * ------------------------------------------------------------------------
 */
@Entity({
  name: 'users',
})
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Optional display name shown on the user profile.
   */
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  name: string | null;

  /**
   * Mobile phone number (unique).
   * Example: 989123456789
   */
  @Column({
    unique: true,
    length: 15,
  })
  phone: string;

  /**
   * Current account lifecycle status.
   */
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  /**
   * Every user belongs to exactly one role.
   */
  @ManyToOne(() => Role, {
    nullable: false,
    eager: true,
  })
  @JoinColumn({
    name: 'role_id',
  })
  role: Role;

  /**
   * Delivery / billing addresses owned by this user.
   */
  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  @CreateDateColumn({
    name: 'created_at',
  })

  /**
   * Shopping carts owned by this user.
   *
   * A user can have multiple carts throughout
   * the lifetime of the account.
   *
   * However, the business rule allows only
   * one ACTIVE cart at a time.
   */
  @OneToMany(() => Cart, (cart) => cart.user)
  carts: Cart[];
  createdAt: Date;

  /**
   * Reviews created by the user.
   *
   * Relationship:
   *
   * User 1 ---- N Review
   */
  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  /**
   * ------------------------------------------------------------------------
   * Notifications
   * ------------------------------------------------------------------------
   *
   * Notifications that belong to this user.
   *
   * Relationship:
   *
   * User 1 ---- * Notifications
   * ------------------------------------------------------------------------
   */
  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  /**
   * Articles created by the user.
   *
   * Only administrators are allowed to create articles.
   *
   * Relationship:
   *
   * User 1 ---- N Article
   */
  @OneToMany(() => Article, (article) => article.author)
  articles: Article[];

  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt: Date | null;
}
