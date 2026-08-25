import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Inventory } from '../entities/inventory.entity';

/**
 * ------------------------------------------------------------------------
 * Inventory Repository
 * ------------------------------------------------------------------------
 *
 * Handles database access related to product inventories.
 *
 * Responsibilities:
 *
 * - Find inventory by product ID
 * - Find inventory with product relation
 * - Create inventory records
 * - Save inventory changes
 *
 * Business logic must remain inside InventoryService.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class InventoryRepository {
  constructor(
    @InjectRepository(Inventory)
    private readonly repository: Repository<Inventory>,
  ) {}

  /**
   * ------------------------------------------------------------------------
   * Find Inventory By Product ID
   * ------------------------------------------------------------------------
   *
   * Finds an inventory record using the related product ID.
   *
   * The product relation is loaded because inventory
   * responses require product information.
   * ------------------------------------------------------------------------
   */
  async findByProductId(productId: string): Promise<Inventory | null> {
    return this.repository.findOne({
      where: {
        product: {
          id: productId,
        },
      },

      relations: {
        product: true,
      },
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Find Inventory By Product ID Without Relations
   * ------------------------------------------------------------------------
   *
   * Used internally when only inventory data is required.
   *
   * This avoids loading unnecessary relations during
   * stock update operations.
   * ------------------------------------------------------------------------
   */
  async findByProductIdWithoutRelations(
    productId: string,
  ): Promise<Inventory | null> {
    return this.repository.findOne({
      where: {
        product: {
          id: productId,
        },
      },
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Create Inventory
   * ------------------------------------------------------------------------
   *
   * Creates an inventory entity in memory.
   *
   * The caller must use save() to persist it.
   * ------------------------------------------------------------------------
   */
  create(data: Partial<Inventory>): Inventory {
    return this.repository.create(data);
  }

  /**
   * ------------------------------------------------------------------------
   * Save Inventory
   * ------------------------------------------------------------------------
   *
   * Persists inventory changes.
   *
   * Used for both inventory creation and updates.
   * ------------------------------------------------------------------------
   */
  async save(inventory: Inventory): Promise<Inventory> {
    return this.repository.save(inventory);
  }
}
