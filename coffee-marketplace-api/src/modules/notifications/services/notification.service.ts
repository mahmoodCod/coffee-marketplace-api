import { Injectable, NotFoundException } from '@nestjs/common';

import { NotificationType } from '../enums/notification-type.enum';

import { Notification } from '../entities/notification.entity';

import { NotificationRepository } from '../repositories/notification.repository';

/**
 * --------------------------------------------------------------------------
 * Notification Service
 * --------------------------------------------------------------------------
 *
 * Handles notification business logic.
 *
 * Responsibilities:
 *
 * - Create notifications.
 * - Get notifications belonging to a user.
 * - Mark user notifications as read.
 *
 * Business Rules:
 *
 * - Users can only view their own notifications.
 * - Users can only mark their own notifications as read.
 * - New notifications are unread by default.
 * --------------------------------------------------------------------------
 */
@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  /**
   * ------------------------------------------------------------------------
   * Create Notification
   * ------------------------------------------------------------------------
   *
   * Creates and persists a new notification
   * for the specified user.
   *
   * Business Rule:
   *
   * New notifications are unread by default.
   * ------------------------------------------------------------------------
   */
  async createNotification(
    userId: string,
    title: string,
    type: NotificationType,
    message: string,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      user: {
        id: userId,
      },
      title,
      type,
      message,
      isRead: false,
    });

    return this.notificationRepository.save(notification);
  }

  /**
   * ------------------------------------------------------------------------
   * Get User Notifications
   * ------------------------------------------------------------------------
   *
   * Returns all notifications belonging
   * to the authenticated user.
   *
   * Users cannot access notifications
   * belonging to other users.
   * ------------------------------------------------------------------------
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.findAllByUserId(userId);
  }

  /**
   * ------------------------------------------------------------------------
   * Mark Notification As Read
   * ------------------------------------------------------------------------
   *
   * Marks a notification as read while ensuring
   * that it belongs to the authenticated user.
   *
   * Business Rules:
   *
   * - Users can only mark their own notifications as read.
   * - A notification must exist and belong to the user.
   * ------------------------------------------------------------------------
   */
  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findByIdAndUserId(
      notificationId,
      userId,
    );

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    /**
     * Avoid unnecessary database updates when
     * the notification has already been read.
     */
    if (notification.isRead) {
      return notification;
    }

    notification.isRead = true;

    return this.notificationRepository.save(notification);
  }
}
