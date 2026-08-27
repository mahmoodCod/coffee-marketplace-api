import { Test, TestingModule } from '@nestjs/testing';

import { NotFoundException } from '@nestjs/common';

import { NotificationService } from '../services/notification.service';

import { NotificationRepository } from '../repositories/notification.repository';

import { Notification } from '../entities/notification.entity';

import { User } from '../../users/entities/user.entity';

import { NotificationType } from '../enums/notification-type.enum';

describe('NotificationService', () => {
  let service: NotificationService;

  let notificationRepository: {
    findAllByUserId: jest.Mock;

    findByIdAndUserId: jest.Mock;

    create: jest.Mock;

    save: jest.Mock;
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
    notificationRepository = {
      findAllByUserId: jest.fn(),

      findByIdAndUserId: jest.fn(),

      create: jest.fn(),

      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,

        {
          provide: NotificationRepository,

          useValue: notificationRepository,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ------------------------------------------------------------------------
   * createNotification
   * ------------------------------------------------------------------------
   */
  describe('createNotification', () => {
    it('should create and save a new unread notification', async () => {
      const user = createUser();

      const notification = createNotification(false);

      notificationRepository.create.mockReturnValue(notification);

      notificationRepository.save.mockResolvedValue(notification);

      const result = await service.createNotification(
        user,
        'Payment Successful',
        NotificationType.PAYMENT_SUCCESS,
        'Your payment was completed successfully.',
      );

      expect(notificationRepository.create).toHaveBeenCalledWith({
        user,

        title: 'Payment Successful',

        type: NotificationType.PAYMENT_SUCCESS,

        message: 'Your payment was completed successfully.',

        isRead: false,
      });

      expect(notificationRepository.save).toHaveBeenCalledWith(notification);

      expect(result).toEqual(notification);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * getUserNotifications
   * ------------------------------------------------------------------------
   */
  describe('getUserNotifications', () => {
    it('should return all notifications belonging to the user', async () => {
      const notifications = [
        createNotification(),

        {
          ...createNotification(),
          id: 'notification-id-2',
        },
      ];

      notificationRepository.findAllByUserId.mockResolvedValue(notifications);

      const result = await service.getUserNotifications(userId);

      expect(notificationRepository.findAllByUserId).toHaveBeenCalledWith(
        userId,
      );

      expect(result).toEqual(notifications);
    });

    it('should return an empty array when user has no notifications', async () => {
      notificationRepository.findAllByUserId.mockResolvedValue([]);

      const result = await service.getUserNotifications(userId);

      expect(result).toEqual([]);

      expect(notificationRepository.findAllByUserId).toHaveBeenCalledWith(
        userId,
      );
    });
  });

  /**
   * ------------------------------------------------------------------------
   * markAsRead
   * ------------------------------------------------------------------------
   */
  describe('markAsRead', () => {
    it('should mark an unread notification as read successfully', async () => {
      const notification = createNotification(false);

      notificationRepository.findByIdAndUserId.mockResolvedValue(notification);

      notificationRepository.save.mockResolvedValue({
        ...notification,
        isRead: true,
      });

      const result = await service.markAsRead(userId, notificationId);

      expect(notificationRepository.findByIdAndUserId).toHaveBeenCalledWith(
        notificationId,
        userId,
      );

      expect(notificationRepository.save).toHaveBeenCalledWith(notification);

      expect(notification.isRead).toBe(true);

      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException when notification does not exist', async () => {
      notificationRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.markAsRead(userId, notificationId)).rejects.toThrow(
        NotFoundException,
      );

      expect(notificationRepository.save).not.toHaveBeenCalled();
    });

    it('should return notification without saving when it is already read', async () => {
      const notification = createNotification(true);

      notificationRepository.findByIdAndUserId.mockResolvedValue(notification);

      const result = await service.markAsRead(userId, notificationId);

      expect(notificationRepository.findByIdAndUserId).toHaveBeenCalledWith(
        notificationId,
        userId,
      );

      expect(notificationRepository.save).not.toHaveBeenCalled();

      expect(result).toEqual(notification);
    });
  });
});
