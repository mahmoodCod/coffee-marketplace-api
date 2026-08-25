import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Inventory } from './entities/inventory.entity';

import { InventoryService } from './services/inventory.service';
import { SellerInventoryController } from './controllers/seller-inventory.controller';
import { AdminInventoryController } from './controllers/admin-inventory.controller';
import { InventoryController } from './controllers/inventory.controller';
import { Product } from '../products/entities/product.entity';
import { InventoryRepository } from './repositories/inventory.repository';

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
  imports: [TypeOrmModule.forFeature([Inventory, Product])],

  controllers: [
    SellerInventoryController,
    AdminInventoryController,
    InventoryController,
  ],

  providers: [InventoryService, InventoryRepository],

  exports: [InventoryService],
})
export class InventoryModule {}
