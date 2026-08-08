import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Inventory } from './entities/inventory.entity';

import { InventoryService } from './services/inventory.service';
import { SellerInventoryController } from './controllers/seller-inventory.controller';
import { AdminInventoryController } from './controllers/admin-inventory.controller';

/**
 * ------------------------------------------------------------------------
 * Inventory Module
 * ------------------------------------------------------------------------
 *
 * Responsibilities:
 *
 * - Stock management
 * - Inventory updates
 * - Product availability handling
 *
 * Exports:
 *
 * InventoryService is exported because
 * Order module will use inventory operations
 * in the future.
 * ------------------------------------------------------------------------
 */
@Module({
  imports: [TypeOrmModule.forFeature([Inventory])],

  controllers: [SellerInventoryController, AdminInventoryController],

  providers: [InventoryService],

  exports: [InventoryService],
})
export class InventoryModule {}
