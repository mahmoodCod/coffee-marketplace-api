import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Coupon } from '../entities/coupon.entity';

@Injectable()
export class CouponRepository {
  constructor(
    @InjectRepository(Coupon)
    private readonly repository: Repository<Coupon>,
  ) {}

  /**
   * Find all coupons.
   */
  async findAll(): Promise<Coupon[]> {
    return this.repository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Find a coupon by its unique identifier.
   */
  async findById(couponId: string): Promise<Coupon | null> {
    return this.repository.findOne({
      where: {
        id: couponId,
      },
    });
  }

  /**
   * Find a coupon by its unique code.
   */
  async findByCode(code: string): Promise<Coupon | null> {
    return this.repository.findOne({
      where: {
        code,
      },
    });
  }

  /**
   * Create a new coupon entity.
   */
  create(data: Partial<Coupon>): Coupon {
    return this.repository.create(data);
  }

  /**
   * Save a coupon.
   */
  async save(coupon: Coupon): Promise<Coupon> {
    return this.repository.save(coupon);
  }

  /**
   * Delete a coupon by its identifier.
   */
  async delete(couponId: string): Promise<void> {
    await this.repository.delete(couponId);
  }

  /**
   * Atomically increment the coupon usage count.
   */
  async incrementUsedCount(couponId: string): Promise<void> {
    await this.repository.increment(
      {
        id: couponId,
      },
      'usedCount',
      1,
    );
  }
}
