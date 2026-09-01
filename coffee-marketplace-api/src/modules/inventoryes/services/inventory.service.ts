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
    @InjectRepository(Product)
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
   * Create Inventory For Product
   * ------------------------------------------------------------------------
   *
   * Creates an inventory record for a product.
   *
   * Business Rule:
   *
   * - Every product must have one inventory.
   * ------------------------------------------------------------------------
   */
  async createForProduct(
    productId: string,
    stock = 0,
  ): Promise<Inventory> {
    const existing = await this.inventoriesRepository.findOne({
      where: {
        product: {
          id: productId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const inventory = this.inventoriesRepository.create({
      product: {
        id: productId,
      } as Product,
      stock,
      reservedStock: 0,
    });

    return this.inventoriesRepository.save(inventory);
  }

  /**
   * ------------------------------------------------------------------------
   * Validate Update DTO
   * ------------------------------------------------------------------------
   *
   * Ensures at least one inventory field is provided.
   *
   * Prevents silent no-op updates when the client
   * sends an empty request body.
   * ------------------------------------------------------------------------
   */
  private validateUpdateDto(dto: UpdateInventoryDto): void {
    if (dto.stock === undefined && dto.reservedStock === undefined) {
      throw new BadRequestException(
        'At least one inventory field must be provided.',
      );
    }
  }

  /**
   * ------------------------------------------------------------------------
   * Get Or Create Inventory
   * ------------------------------------------------------------------------
   *
   * Finds the inventory associated with a product,
   * or creates one if it does not exist yet.
   *
   * Business Rule:
   *
   * - Every product should have an inventory record.
   * ------------------------------------------------------------------------
   */
  private async getOrCreateInventory(productId: string): Promise<Inventory> {
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

    if (inventory) {
      return inventory;
    }

    return this.createForProduct(productId);
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
    this.validateUpdateDto(dto);

    const inventory = await this.getOrCreateInventory(productId);

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
  ): Promise<InventoryResponseDto> {
    this.validateUpdateDto(dto);

    /**
     * Find the product using both the product ID
     * and the authenticated seller ID.
     *
     * This ensures that a seller can only
     * manage inventory belonging to them.
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
     * If the product does not exist or does not
     * belong to the authenticated seller,
     * prevent the inventory update.
     */
    if (!product) {
      throw new ForbiddenException(
        'You do not have permission to update this product inventory',
      );
    }

    /**
     * Find the inventory associated with the product,
     * or create one if it does not exist yet.
     *
     * Every product should have an inventory record.
     */
    const inventory = await this.getOrCreateInventory(productId);

    /**
     * Update stock only when provided.
     */
    if (dto.stock !== undefined) {
      inventory.stock = dto.stock;
    }

    /**
     * Update reserved stock only when provided.
     */
    if (dto.reservedStock !== undefined) {
      inventory.reservedStock = dto.reservedStock;
    }

    /**
     * Reserved stock cannot exceed
     * the total available stock.
     */
    if (inventory.reservedStock > inventory.stock) {
      throw new BadRequestException('Reserved stock cannot exceed stock.');
    }

    /**
     * Save the updated inventory.
     */
    const savedInventory = await this.inventoriesRepository.save(inventory);

    /**
     * Return the API response DTO instead
     * of exposing the database entity directly.
     */
    return {
      id: savedInventory.id,

      productId: productId,

      stock: savedInventory.stock,

      reservedStock: savedInventory.reservedStock,

      createdAt: savedInventory.createdAt,

      updatedAt: savedInventory.updatedAt,
    };
  }

  /**
   * Decrease product stock after a successful payment.
   *
   * This method is intended for internal business operations
   * and should not be exposed directly to customers.
   *
   * Business Rules:
   * - The inventory must exist.
   * - The requested quantity must be greater than zero.
   * - Stock cannot become negative.
   */
  async decreaseStock(productId: string, quantity: number): Promise<Inventory> {
    const inventory = await this.findByProductId(productId);

    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero.');
    }

    if (inventory.stock < quantity) {
      throw new BadRequestException('Insufficient product stock.');
    }

    inventory.stock -= quantity;

    return this.inventoriesRepository.save(inventory);
  }

  /**
   * Increase product stock.
   *
   * This method is intended for internal business operations
   * such as restocking products.
   *
   * Business Rules:
   * - The inventory must exist.
   * - The requested quantity must be greater than zero.
   */
  async increaseStock(productId: string, quantity: number): Promise<Inventory> {
    /**
     * Find the inventory related to the product.
     */
    const inventory = await this.findByProductId(productId);

    /**
     * Prevent invalid stock updates.
     */
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than zero.');
    }

    /**
     * Increase the available product stock.
     */
    inventory.stock += quantity;

    /**
     * Persist and return the updated inventory.
     */
    return this.inventoriesRepository.save(inventory);
  }
}
