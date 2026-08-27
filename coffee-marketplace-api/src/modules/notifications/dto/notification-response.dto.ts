import { NotificationType } from '../enums/notification-type.enum';

/**
 * ------------------------------------------------------------------------
 * Notification Response DTO
 * ------------------------------------------------------------------------
 *
 * Defines the notification data returned
 * from the API to the authenticated user.
 * ------------------------------------------------------------------------
 */
export class NotificationResponseDto {
  /**
   * Notification unique identifier.
   */
  id: string;

  /**
   * Notification title.
   */
  title: string;

  /**
   * Notification type.
   */
  type: NotificationType;

  /**
   * Notification message.
   */
  message: string;

  /**
   * Indicates whether the notification
   * has been read by the user.
   */
  isRead: boolean;

  /**
   * Notification creation timestamp.
   */
  createdAt: Date;
}
