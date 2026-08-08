import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Inventory } from './entities/inventory.entity';

import { InventoryService } from './services/inventory.service';

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

  providers: [InventoryService],

  exports: [InventoryService],
})
export class InventoryModule {}
