import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Notification } from '../entities/notification.entity';

/**
 * --------------------------------------------------------------------------
 * Notification Repository
 * --------------------------------------------------------------------------
 *
 * Handles database access related to user notifications.
 *
 * Responsibilities:
 *
 * - Find notifications belonging to a user.
 * - Find a specific notification owned by a user.
 * - Create and save notifications.
 *
 * Business logic must remain inside NotificationService.
 * --------------------------------------------------------------------------
 */
@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repository: Repository<Notification>,
  ) {}

  /**
   * ------------------------------------------------------------------------
   * Find All By User ID
   * ------------------------------------------------------------------------
   *
   * Returns all notifications belonging
   * to the specified user.
   *
   * Notifications are ordered from newest
   * to oldest.
   * ------------------------------------------------------------------------
   */
  async findAllByUserId(userId: string): Promise<Notification[]> {
    return this.repository.find({
      where: {
        user: {
          id: userId,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Find By ID And User ID
   * ------------------------------------------------------------------------
   *
   * Finds a notification while ensuring
   * that it belongs to the specified user.
   *
   * Used when a user marks one of their
   * own notifications as read.
   * ------------------------------------------------------------------------
   */
  async findByIdAndUserId(
    notificationId: string,
    userId: string,
  ): Promise<Notification | null> {
    return this.repository.findOne({
      where: {
        id: notificationId,
        user: {
          id: userId,
        },
      },
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Create Notification
   * ------------------------------------------------------------------------
   *
   * Creates a notification entity in memory.
   *
   * The caller must use save() to persist it.
   * ------------------------------------------------------------------------
   */
  create(data: Partial<Notification>): Notification {
    return this.repository.create(data);
  }

  /**
   * ------------------------------------------------------------------------
   * Save Notification
   * ------------------------------------------------------------------------
   *
   * Persists a new notification or
   * updates an existing notification.
   * ------------------------------------------------------------------------
   */
  async save(notification: Notification): Promise<Notification> {
    return this.repository.save(notification);
  }
}
