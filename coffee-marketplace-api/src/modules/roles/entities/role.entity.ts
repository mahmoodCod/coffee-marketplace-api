import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * Represents a role within the application's Role-Based Access Control (RBAC) system.
 *
 * Every user must be assigned exactly one role.
 * Roles determine the permissions and access level of users
 * throughout the Coffee Marketplace platform.
 */
@Entity('roles')
export class Role {
  /**
   * Unique identifier for the role.
   *
   * UUID is used instead of auto-increment IDs to improve
   * security and support distributed systems in the future.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Human-readable role name.
   *
   * Examples:
   * - admin
   * - seller
   * - customer
   *
   * Must remain unique across the entire system.
   */
  @Column({ unique: true, length: 50 })
  name: string;

  /**
   * Optional description used by administrators
   * to explain the purpose of the role.
   */
  @Column({ nullable: true, type: 'text' })
  description?: string;

  /**
   * Timestamp automatically generated when
   * the role is first created.
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  /**
   * Timestamp automatically updated whenever
   * the role is modified.
   */
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  /**
   * Soft delete timestamp.
   *
   * Deleted roles remain in the database for
   * auditing and historical data integrity.
   */
  @DeleteDateColumn({
    name: 'deleted_at',
    nullable: true,
  })
  deletedAt?: Date;
}
