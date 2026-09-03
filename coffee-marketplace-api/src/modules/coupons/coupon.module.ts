import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Coupon } from './entities/coupon.entity';
import { CouponRepository } from './repositories/coupon.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon])],
  providers: [CouponRepository],
  exports: [CouponRepository],
})
export class CouponModule {}
