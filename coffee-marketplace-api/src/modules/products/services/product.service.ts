import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Product } from '../entities/product.entity';

/**
 * ------------------------------------------------------------------------
 * Product Service
 * ------------------------------------------------------------------------
 *
 * Handles all product business logic.
 *
 * Responsibilities
 * ------------------------------------------------------------------------
 *
 * - Create product
 * - Update product
 * - Delete product
 * - Retrieve products
 *
 * Business Rules
 * ------------------------------------------------------------------------
 *
 * - Product slug must be unique.
 * - Seller can manage only their own products.
 * - Products cannot have empty prices.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  /**
   * ------------------------------------------------------------------------
   * Find Product Or Fail
   * ------------------------------------------------------------------------
   *
   * Loads a product by its identifier.
   *
   * Throws:
   * NotFoundException
   *
   * if product does not exist.
   * ------------------------------------------------------------------------
   */
  private async findProductOrFail(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: {
        id,
      },

      relations: {
        seller: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return product;
  }

  /**
   * ------------------------------------------------------------------------
   * Ensure Slug Is Unique
   * ------------------------------------------------------------------------
   *
   * Business Rule:
   *
   * Product slug must be unique.
   *
   * Throws:
   *
   * ConflictException
   * ------------------------------------------------------------------------
   */
  private async ensureSlugUnique(slug: string): Promise<void> {
    const exists = await this.productsRepository.exists({
      where: {
        slug,
      },
    });

    if (exists) {
      throw new ConflictException('Product slug already exists.');
    }
  }
}
