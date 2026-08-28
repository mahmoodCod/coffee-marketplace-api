import { Test, TestingModule } from '@nestjs/testing';

import { NotificationController } from '../controllers/notification.controller';

import { NotificationService } from '../services/notification.service';

import { Notification } from '../entities/notification.entity';

import { User } from '../../users/entities/user.entity';

import { NotificationType } from '../enums/notification-type.enum';
import { NotFoundException } from '@nestjs/common';

describe('NotificationController', () => {
  let controller: NotificationController;

  let notificationService: {
    getUserNotifications: jest.Mock;

    markAsRead: jest.Mock;
  };

  const userId = 'user-id';

  const notificationId = 'notification-id';

  /**
   * ------------------------------------------------------------------------
   * Create Mock User
   * ------------------------------------------------------------------------
   */
  const createUser = (): User =>
    ({
      id: userId,
    }) as User;

  /**
   * ------------------------------------------------------------------------
   * Create Mock Notification
   * ------------------------------------------------------------------------
   */
  const createNotification = (isRead = false): Notification =>
    ({
      id: notificationId,

      user: createUser(),

      title: 'Payment Successful',

      type: NotificationType.PAYMENT_SUCCESS,

      message: 'Your payment was completed successfully.',

      isRead,

      createdAt: new Date(),
    }) as Notification;

  beforeEach(async () => {
    notificationService = {
      getUserNotifications: jest.fn(),

      markAsRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],

      providers: [
        {
          provide: NotificationService,

          useValue: notificationService,
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ------------------------------------------------------------------------
   * GET /notifications
   * ------------------------------------------------------------------------
   */
  describe('getNotifications', () => {
    it('should return authenticated user notifications', async () => {
      const notifications = [
        createNotification(),

        {
          ...createNotification(),
          id: 'notification-id-2',
          title: 'Registration Successful',
          type: NotificationType.REGISTRATION,
        },
      ];

      notificationService.getUserNotifications.mockResolvedValue(notifications);

      const result = await controller.getNotifications(userId);

      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
        userId,
      );

      expect(result).toHaveLength(2);

      expect(result[0]).toEqual({
        id: notifications[0].id,
        title: notifications[0].title,
        type: notifications[0].type,
        message: notifications[0].message,
        isRead: notifications[0].isRead,
        createdAt: notifications[0].createdAt,
      });

      expect(result[1]).toEqual({
        id: notifications[1].id,
        title: notifications[1].title,
        type: notifications[1].type,
        message: notifications[1].message,
        isRead: notifications[1].isRead,
        createdAt: notifications[1].createdAt,
      });
    });

    it('should return an empty array when user has no notifications', async () => {
      notificationService.getUserNotifications.mockResolvedValue([]);

      const result = await controller.getNotifications(userId);

      expect(notificationService.getUserNotifications).toHaveBeenCalledWith(
        userId,
      );

      expect(result).toEqual([]);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * PATCH /notifications/:id/read
   * ------------------------------------------------------------------------
   */
  describe('markNotificationAsRead', () => {
    it('should mark authenticated user notification as read', async () => {
      const notification = createNotification(true);

      notificationService.markAsRead.mockResolvedValue(notification);

      const result = await controller.markNotificationAsRead(
        userId,
        notificationId,
      );

      expect(notificationService.markAsRead).toHaveBeenCalledWith(
        userId,
        notificationId,
      );

      expect(result).toEqual({
        id: notification.id,
        title: notification.title,
        type: notification.type,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
      });
    });

    it('should propagate NotFoundException when notification does not exist', async () => {
      notificationService.markAsRead.mockRejectedValue(
        new NotFoundException('Notification not found.'),
      );

      await expect(
        controller.markNotificationAsRead(userId, notificationId),
      ).rejects.toThrow(NotFoundException);

      expect(notificationService.markAsRead).toHaveBeenCalledWith(
        userId,
        notificationId,
      );
    });
  });
});
