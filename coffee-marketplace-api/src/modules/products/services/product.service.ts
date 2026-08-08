import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Product } from '../entities/product.entity';
import { UsersService } from 'src/modules/users/services/user.service';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';
import { CreateProductDto } from '../dto';
import { SYSTEM_ROLES } from 'src/common/constants/system-roles.constant';
import { ProductStatus } from '../enums';

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
    private readonly usersService: UsersService,
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

  /**
   * ------------------------------------------------------------------------
   * Ensure Seller Owns Product
   * ------------------------------------------------------------------------
   *
   * Business Rule:
   *
   * Sellers may only manage
   * their own products.
   *
   * Throws:
   *
   * ForbiddenException
   * ------------------------------------------------------------------------
   */
  private ensureSellerOwnsProduct(product: Product, sellerId: string): void {
    if (product.seller.id !== sellerId) {
      throw new ForbiddenException('You cannot manage this product.');
    }
  }

  /**
   * ------------------------------------------------------------------------
   * Create Product
   * ------------------------------------------------------------------------
   *
   * Creates a new product owned by
   * the authenticated seller.
   *
   * Business Rules
   * ------------------------------------------------------------------------
   *
   * - Only sellers can create products.
   * - Product slug must be unique.
   * - Product owner is always current seller.
   * ------------------------------------------------------------------------
   */
  async create(
    currentUser: JwtPayload,
    dto: CreateProductDto,
  ): Promise<Product> {
    /**
     * Only sellers may create products.
     */
    if (currentUser.role !== SYSTEM_ROLES.SELLER) {
      throw new ForbiddenException('Only sellers can create products.');
    }

    /**
     * Slug must be unique.
     */
    await this.ensureSlugUnique(dto.slug);

    /**
     * Load seller.
     */
    const seller = await this.usersService.findById(currentUser.sub);

    /**
     * Create entity.
     */
    const product = this.productsRepository.create({
      ...dto,

      seller,

      status: dto.status ?? ProductStatus.DRAFT,
    });

    /**
     * Save product.
     */
    return this.productsRepository.save(product);
  }
}
