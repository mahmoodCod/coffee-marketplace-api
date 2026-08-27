import { Test, TestingModule } from '@nestjs/testing';

import { getRepositoryToken } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { NotificationRepository } from '../repositories/notification.repository';

import { Notification } from '../entities/notification.entity';

import { User } from '../../users/entities/user.entity';

import { NotificationType } from '../enums/notification-type.enum';

describe('NotificationRepository', () => {
  let notificationRepository: NotificationRepository;

  let repository: jest.Mocked<Repository<Notification>>;

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
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationRepository,

        {
          provide: getRepositoryToken(Notification),

          useValue: {
            find: jest.fn(),

            findOne: jest.fn(),

            create: jest.fn(),

            save: jest.fn(),
          },
        },
      ],
    }).compile();

    notificationRepository = module.get<NotificationRepository>(
      NotificationRepository,
    );

    repository = module.get(getRepositoryToken(Notification));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ------------------------------------------------------------------------
   * findAllByUserId
   * ------------------------------------------------------------------------
   */
  describe('findAllByUserId', () => {
    it('should return all notifications belonging to a user', async () => {
      const notifications = [
        createNotification(),

        {
          ...createNotification(),
          id: 'notification-id-2',
        },
      ];

      repository.find.mockResolvedValue(notifications);

      const result = await notificationRepository.findAllByUserId(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          user: {
            id: userId,
          },
        },

        order: {
          createdAt: 'DESC',
        },
      });

      expect(result).toEqual(notifications);
    });

    it('should return an empty array when user has no notifications', async () => {
      repository.find.mockResolvedValue([]);

      const result = await notificationRepository.findAllByUserId(userId);

      expect(result).toEqual([]);

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          user: {
            id: userId,
          },
        },

        order: {
          createdAt: 'DESC',
        },
      });
    });
  });

  /**
   * ------------------------------------------------------------------------
   * findByIdAndUserId
   * ------------------------------------------------------------------------
   */
  describe('findByIdAndUserId', () => {
    it('should return notification when it belongs to the user', async () => {
      const notification = createNotification();

      repository.findOne.mockResolvedValue(notification);

      const result = await notificationRepository.findByIdAndUserId(
        notificationId,
        userId,
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: notificationId,

          user: {
            id: userId,
          },
        },
      });

      expect(result).toEqual(notification);
    });

    it('should return null when notification does not exist or does not belong to user', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await notificationRepository.findByIdAndUserId(
        notificationId,
        userId,
      );

      expect(result).toBeNull();

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: notificationId,

          user: {
            id: userId,
          },
        },
      });
    });
  });

  /**
   * ------------------------------------------------------------------------
   * create
   * ------------------------------------------------------------------------
   */
  describe('create', () => {
    it('should create a notification entity', () => {
      const notification = createNotification();

      const data: Partial<Notification> = {
        user: createUser(),

        title: 'Payment Successful',

        type: NotificationType.PAYMENT_SUCCESS,

        message: 'Your payment was completed successfully.',

        isRead: false,
      };

      repository.create.mockReturnValue(notification);

      const result = notificationRepository.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);

      expect(result).toEqual(notification);
    });
  });

  /**
   * ------------------------------------------------------------------------
   * save
   * ------------------------------------------------------------------------
   */
  describe('save', () => {
    it('should save a notification', async () => {
      const notification = createNotification();

      repository.save.mockResolvedValue(notification);

      const result = await notificationRepository.save(notification);

      expect(repository.save).toHaveBeenCalledWith(notification);

      expect(result).toEqual(notification);
    });
  });
});
