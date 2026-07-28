import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Role } from '../../roles/entities/role.entity';
import { UserStatus } from '../enums/user-status.enum';

/**
 * ------------------------------------------------------------------------
 * User Entity
 * ------------------------------------------------------------------------
 *
 * Represents every authenticated person in the Coffee Marketplace.
 *
 * Responsibilities:
 * - Stores the user's identity.
 * - Stores authentication information.
 * - Connects the user to a system role.
 *
 * Authentication:
 * Users authenticate using their mobile phone number.
 *
 * Notes:
 * - Mobile numbers are stored using E.164 format.
 * - Every user must have exactly one role.
 * - Soft delete is enabled.
 *
 * Future Relationships:
 * - User → Addresses
 * - User → Orders
 * - User → Reviews
 * - User → Notifications
 * ------------------------------------------------------------------------
 */

@Entity({
  name: 'users',
})
export class User {
  /**
   * Primary UUID identifier.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Mobile phone number.
   *
   * Stored using E.164 format.
   *
   * Example:
   * 989121234567
   */
  @Column({
    unique: true,
    length: 15,
  })
  phone: string;

  /**
   * Current user account status.
   */
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  /**
   * Every user belongs to one role.
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
