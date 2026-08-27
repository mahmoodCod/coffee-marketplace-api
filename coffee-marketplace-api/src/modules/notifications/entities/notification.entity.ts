import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

import { NotificationType } from '../enums/notification-type.enum';

/**
 * ------------------------------------------------------------------------
 * Notification Entity
 * ------------------------------------------------------------------------
 *
 * Represents a notification belonging to a user.
 *
 * Responsibilities:
 *
 * - Store notification information.
 * - Track whether a notification has been read.
 * - Associate each notification with a user.
 *
 * Business Rules:
 *
 * - Every notification belongs to one user.
 * - New notifications are unread by default.
 * - Users can only access their own notifications.
 * ------------------------------------------------------------------------
 */
@Entity({
  name: 'notifications',
})
@Index(['user', 'createdAt'])
@Index(['user', 'isRead'])
export class Notification {
  /**
   * Notification unique identifier.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * User that owns this notification.
   *
   * Relationship:
   *
   * User 1 ---- * Notifications
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
   * Notification title.
   */
  @Column({
    type: 'varchar',
    length: 150,
  })
  title: string;

  /**
   * Notification type.
   *
   * Identifies the event that caused
   * this notification to be created.
   */
  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  /**
   * Notification message.
   */
  @Column({
    type: 'text',
  })
  message: string;

  /**
   * Indicates whether the notification
   * has been read by the user.
   *
   * New notifications are unread by default.
   */
  @Column({
    name: 'is_read',
    type: 'boolean',
    default: false,
  })
  isRead: boolean;

  /**
   * Notification creation timestamp.
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;
}
