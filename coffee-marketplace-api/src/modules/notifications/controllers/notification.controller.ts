import { Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { NotificationService } from '../services/notification.service';

import { NotificationResponseDto } from '../dto/notification-response.dto';

/**
 * --------------------------------------------------------------------------
 * Notification Controller
 * --------------------------------------------------------------------------
 *
 * Handles HTTP requests related to
 * authenticated user notifications.
 *
 * Available operations:
 *
 * - Get authenticated user notifications.
 * - Mark one of the user's notifications as read.
 * --------------------------------------------------------------------------
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * ------------------------------------------------------------------------
   * Get User Notifications
   * ------------------------------------------------------------------------
   *
   * Returns all notifications belonging
   * to the authenticated user.
   *
   * GET /notifications
   * ------------------------------------------------------------------------
   */
  @Get()
  @ApiOperation({
    summary: 'Get authenticated user notifications',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully.',
    type: NotificationResponseDto,
    isArray: true,
  })
  async getNotifications(
    @CurrentUser('sub') userId: string,
  ): Promise<NotificationResponseDto[]> {
    const notifications =
      await this.notificationService.getUserNotifications(userId);

    return notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      type: notification.type,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    }));
  }

  /**
   * ------------------------------------------------------------------------
   * Mark Notification As Read
   * ------------------------------------------------------------------------
   *
   * Marks a notification as read while ensuring
   * that it belongs to the authenticated user.
   *
   * PATCH /notifications/:id/read
   * ------------------------------------------------------------------------
   */
  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark a notification as read',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read successfully.',
    type: NotificationResponseDto,
  })
  async markNotificationAsRead(
    @CurrentUser('sub') userId: string,

    @Param('id', new ParseUUIDPipe()) notificationId: string,
  ): Promise<NotificationResponseDto> {
    const notification = await this.notificationService.markAsRead(
      userId,
      notificationId,
    );

    return {
      id: notification.id,
      title: notification.title,
      type: notification.type,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }
}
