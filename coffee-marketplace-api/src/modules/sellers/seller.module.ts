import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';

import { SellerController } from './controllers/seller.controller';
import { SellerService } from './services/seller.service';

/**
 * ------------------------------------------------------------------------
 * Seller Module
 * ------------------------------------------------------------------------
 *
 * Responsibilities:
 * - Seller profile management
 * - Seller dashboard (future)
 * - Seller reports (future)
 * - Seller products (future)
 * - Seller orders (future)
 * ------------------------------------------------------------------------
 */

@Module({
  imports: [UsersModule],

  controllers: [SellerController],

  providers: [SellerService],

  exports: [SellerService],
})
export class SellerModule {}
