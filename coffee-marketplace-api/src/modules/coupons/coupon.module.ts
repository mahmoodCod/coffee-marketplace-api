import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Coupon } from './entities/coupon.entity';
import { CouponRepository } from './repositories/coupon.repository';
import { CouponService } from './services/coupon.service';
import { CouponController } from './controllers/coupon.controller';
import { OrdersModule } from '../orders/order.module';
import { OrderCouponController } from './controllers/order-coupon.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon]), OrdersModule],
  controllers: [CouponController, OrderCouponController],
  providers: [CouponRepository, CouponService],
  exports: [CouponRepository, CouponService],
})
export class CouponModule {}
