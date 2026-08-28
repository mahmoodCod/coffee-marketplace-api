import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Notification } from './entities/notification.entity';

import { NotificationController } from './controllers/notification.controller';

import { NotificationService } from './services/notification.service';

import { NotificationRepository } from './repositories/notification.repository';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities';
import { Payment } from '../payments/entities/payment.entity';

/**
 * ------------------------------------------------------------------------
 * Notifications Module
 * ------------------------------------------------------------------------
 *
 * Responsible for configuring all dependencies
 * required by the notifications feature.
 *
 * Includes:
 *
 * - Notification entity.
 * - Notification repository.
 * - Notification service.
 * - Notification controller.
 *
 * ------------------------------------------------------------------------
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Order, Payment])],

  controllers: [NotificationController],

  providers: [NotificationService, NotificationRepository],

  exports: [NotificationService],
})
export class NotificationsModule {}
