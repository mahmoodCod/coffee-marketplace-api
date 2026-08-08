import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Product } from '../entities/product.entity';
import { UsersService } from '../../../modules/users/services/user.service';
import { JwtPayload } from '../../../modules/auth/interfaces/jwt-payload.interface';
import { CreateProductDto, UpdateProductDto } from '../dto';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';
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
    const created = await this.productsRepository.save(product);

    return created;
  }

  /**
   * ------------------------------------------------------------------------
   * Update Product
   * ------------------------------------------------------------------------
   *
   * Updates an existing product.
   *
   * Business Rules
   * ------------------------------------------------------------------------
   *
   * - Only sellers can update products.
   * - Seller can update only their own products.
   * - Slug must remain unique.
   * ------------------------------------------------------------------------
   */
  async update(
    id: string,
    currentUser: JwtPayload,
    dto: UpdateProductDto,
  ): Promise<Product> {
    /**
     * Only sellers may update products.
     */
    if (currentUser.role !== SYSTEM_ROLES.SELLER) {
      throw new ForbiddenException('Only sellers can update products.');
    }

    /**
     * Load product.
     */
    const product = await this.findProductOrFail(id);

    /**
     * Verify ownership.
     */
    this.ensureSellerOwnsProduct(product, currentUser.sub);

    /**
     * Validate slug if changed.
     */
    if (dto.slug && dto.slug !== product.slug) {
      await this.ensureSlugUnique(dto.slug);
    }

    /**
     * Apply changes.
     */
    if (dto.title !== undefined) {
      product.title = dto.title;
    }

    if (dto.slug !== undefined) {
      product.slug = dto.slug;
    }

    if (dto.description !== undefined) {
      product.description = dto.description;
    }

    if (dto.price !== undefined) {
      product.price = dto.price;
    }

    if (dto.originalPrice !== undefined) {
      product.originalPrice = dto.originalPrice;
    }

    if (dto.productType !== undefined) {
      product.productType = dto.productType;
    }

    if (dto.weight !== undefined) {
      product.weight = dto.weight;
    }

    if (dto.originCountry !== undefined) {
      product.originCountry = dto.originCountry;
    }

    if (dto.hasWarranty !== undefined) {
      product.hasWarranty = dto.hasWarranty;
    }

    if (dto.warrantyDescription !== undefined) {
      product.warrantyDescription = dto.warrantyDescription;
    }

    if (dto.status !== undefined) {
      product.status = dto.status;
    }

    /**
     * Save changes.
     */
    return this.productsRepository.save(product);
  }

  /**
   * ------------------------------------------------------------------------
   * Soft Delete Product
   * ------------------------------------------------------------------------
   *
   * Soft deletes an existing product.
   *
   * Business Rules
   * ------------------------------------------------------------------------
   *
   * - Only sellers can delete products.
   * - Seller can delete only their own products.
   * - Product is soft deleted.
   * ------------------------------------------------------------------------
   */
  async softDelete(id: string, currentUser: JwtPayload): Promise<void> {
    /**
     * Only sellers may delete products.
     */
    if (currentUser.role !== SYSTEM_ROLES.SELLER) {
      throw new ForbiddenException('Only sellers can delete products.');
    }

    /**
     * Load product.
     */
    const product = await this.findProductOrFail(id);

    /**
     * Verify ownership.
     */
    this.ensureSellerOwnsProduct(product, currentUser.sub);

    /**
     * Soft delete product.
     */
    await this.productsRepository.softRemove(product);
  }

  /**
   * ------------------------------------------------------------------------
   * Find All Products
   * ------------------------------------------------------------------------
   *
   * Returns all active products.
   *
   * Used by:
   *
   * GET /products
   *
   * Notes
   * ------------------------------------------------------------------------
   *
   * Soft deleted products are automatically excluded.
   * ------------------------------------------------------------------------
   */
  async findAll(): Promise<Product[]> {
    return this.productsRepository.find({
      where: {
        status: ProductStatus.ACTIVE,
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Find Seller Products
   * ------------------------------------------------------------------------
   *
   * Returns products owned by a specific seller.
   *
   * Used by:
   *
   * GET /seller/products
   *
   * Business Rules:
   *
   * - Seller can only see products that belong to them.
   * - Soft deleted products are excluded.
   * ------------------------------------------------------------------------
   */
  async findSellerProducts(sellerId: string): Promise<Product[]> {
    return this.productsRepository.find({
      where: {
        seller: {
          id: sellerId,
        },
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Find Product
   * ------------------------------------------------------------------------
   *
   * Returns one product by identifier.
   *
   * Used by:
   *
   * GET /products/:id
   * ------------------------------------------------------------------------
   */
  async findOne(id: string): Promise<Product> {
    return this.findProductOrFail(id);
  }

  /**
   * ------------------------------------------------------------------------
   * Find All Products For Admin
   * ------------------------------------------------------------------------
   *
   * Returns all products for administration.
   *
   * Business Rule:
   *
   * Admin can see all products regardless of status.
   *
   * Includes:
   *
   * - Active products
   * - Pending products
   * - Inactive products
   * ------------------------------------------------------------------------
   */
  async findAllAdmin(): Promise<Product[]> {
    return this.productsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Admin Update Product
   * ------------------------------------------------------------------------
   *
   * Updates any product regardless of ownership.
   *
   * Business Rule:
   *
   * Admin can manage all products.
   * ------------------------------------------------------------------------
   */
  async adminUpdate(
    id: string,

    dto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    /**
     * Update editable fields.
     */
    if (dto.title !== undefined) {
      product.title = dto.title;
    }

    if (dto.description !== undefined) {
      product.description = dto.description;
    }

    if (dto.price !== undefined) {
      product.price = dto.price;
    }

    return this.productsRepository.save(product);
  }

  /**
   * ------------------------------------------------------------------------
   * Admin Delete Product
   * ------------------------------------------------------------------------
   *
   * Soft deletes any product.
   *
   * Business Rule:
   *
   * Admin is allowed to remove
   * any product from platform.
   * ------------------------------------------------------------------------
   */
  async adminDelete(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({
      where: {
        id,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return this.productsRepository.softRemove(product);
  }
}
