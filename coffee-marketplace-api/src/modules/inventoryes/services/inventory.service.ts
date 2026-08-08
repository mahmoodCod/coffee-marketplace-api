import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Inventory } from '../entities/inventory.entity';

import { UpdateInventoryDto, InventoryResponseDto } from '../dto';

/**
 * ------------------------------------------------------------------------
 * Inventory Service
 * ------------------------------------------------------------------------
 *
 * Handles inventory business logic.
 *
 * Responsibilities:
 *
 * - Retrieve inventory
 * - Update stock
 * - Check stock availability
 * - Increase stock
 * - Decrease stock
 * ------------------------------------------------------------------------
 */
@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory)
    private readonly inventoriesRepository: Repository<Inventory>,
  ) {}

  /**
   * ------------------------------------------------------------------------
   * Find Inventory By Product
   * ------------------------------------------------------------------------
   *
   * Returns inventory information
   * of a specific product.
   * ------------------------------------------------------------------------
   */
  async findByProductId(productId: string): Promise<Inventory> {
    const inventory = await this.inventoriesRepository.findOne({
      where: {
        product: {
          id: productId,
        },
      },

      relations: {
        product: true,
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found.');
    }

    return inventory;
  }

  /**
   * ------------------------------------------------------------------------
   * Update Inventory
   * ------------------------------------------------------------------------
   *
   * Updates inventory quantities.
   * ------------------------------------------------------------------------
   */
  async updateInventory(
    productId: string,
    dto: UpdateInventoryDto,
  ): Promise<InventoryResponseDto> {
    const inventory = await this.findByProductId(productId);

    if (dto.stock !== undefined) {
      inventory.stock = dto.stock;
    }

    if (dto.reservedStock !== undefined) {
      inventory.reservedStock = dto.reservedStock;
    }

    if (inventory.reservedStock > inventory.stock) {
      throw new BadRequestException('Reserved stock cannot exceed stock.');
    }

    const updated = await this.inventoriesRepository.save(inventory);

    return {
      id: updated.id,

      productId: updated.product.id,

      stock: updated.stock,

      reservedStock: updated.reservedStock,

      createdAt: updated.createdAt,

      updatedAt: updated.updatedAt,
    };
  }
}
