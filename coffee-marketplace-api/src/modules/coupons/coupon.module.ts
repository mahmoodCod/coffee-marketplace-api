import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Coupon } from './entities/coupon.entity';
import { CouponRepository } from './repositories/coupon.repository';
import { CouponService } from './services/coupon.service';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon])],
  providers: [CouponRepository, CouponService],
  exports: [CouponRepository, CouponService],
})
export class CouponModule {}
