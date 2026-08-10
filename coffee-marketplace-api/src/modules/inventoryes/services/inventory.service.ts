import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Inventory } from '../entities/inventory.entity';

import { UpdateInventoryDto, InventoryResponseDto } from '../dto';
import { Product } from 'src/modules/products/entities/product.entity';

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
    private readonly productRepository: Repository<Product>,
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

  /**
   * ------------------------------------------------------------------------
   * Get Public Inventory
   * ------------------------------------------------------------------------
   *
   * Returns public inventory information.
   *
   * Used by customers to check product availability.
   *
   * ------------------------------------------------------------------------
   */
  async getPublicInventory(productId: string): Promise<InventoryResponseDto> {
    const inventory = await this.findByProductId(productId);

    return {
      id: inventory.id,

      productId: inventory.product.id,

      stock: inventory.stock,

      reservedStock: inventory.reservedStock,

      createdAt: inventory.createdAt,

      updatedAt: inventory.updatedAt,
    };
  }

  async updateSellerInventory(
    productId: string,
    sellerId: string,
    dto: UpdateInventoryDto,
  ): Promise<Inventory> {
    /**
     * Find the product by both product ID
     * and seller ID.
     *
     * This is important for marketplace security:
     * a seller must only be able to update
     * the inventory of their own products.
     *
     * If the product exists but belongs to
     * another seller, it will not be returned.
     */
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        seller: {
          id: sellerId,
        },
      },
    });

    /**
     * If no product is found, either:
     *
     * 1. The product does not exist.
     * 2. The product belongs to another seller.
     *
     * In both cases, we prevent the seller
     * from modifying the inventory.
     */
    if (!product) {
      throw new ForbiddenException(
        'You do not have permission to update this product inventory',
      );
    }

    /**
     * Find the inventory associated with
     * the requested product.
     */
    const inventory = await this.inventoriesRepository.findOne({
      where: {
        product: {
          id: productId,
        },
      },
    });

    /**
     * A product should have an inventory record.
     *
     * If the inventory does not exist,
     * return a not-found error instead of
     * trying to update a non-existing record.
     */
    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    /**
     * Update stock only when the field
     * is explicitly provided in the DTO.
     *
     * This keeps the update operation
     * partial and prevents undefined values
     * from overwriting existing data.
     */
    if (dto.stock !== undefined) {
      inventory.stock = dto.stock;
    }

    /**
     * Update reserved stock only when
     * it is explicitly provided.
     */
    if (dto.reservedStock !== undefined) {
      inventory.reservedStock = dto.reservedStock;
    }

    /**
     * Persist the updated inventory
     * and return the saved entity.
     */
    return this.inventoriesRepository.save(inventory);
  }
}
