import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { ProductDiscount } from '../../products/entities/product-discount.entity';

/**
 * ------------------------------------------------------------------------
 * Product Discount Repository
 * ------------------------------------------------------------------------
 *
 * Handles database operations for the product_discounts junction table.
 *
 * Responsibilities
 * ------------------------------------------------------------------------
 *
 * - Find discount assignments by discount.
 * - Find discount assignments by product.
 * - Check whether a discount is attached to a seller's product.
 * - Create product-discount associations.
 * - Save product-discount associations.
 * - Remove product-discount associations.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class ProductDiscountRepository {
  constructor(
    @InjectRepository(ProductDiscount)
    private readonly repository: Repository<ProductDiscount>,
  ) {}

  /**
   * ----------------------------------------------------------------------
   * Find all product assignments for a discount
   * ----------------------------------------------------------------------
   *
   * Returns all products associated with the given discount.
   */
  async findAllByDiscountId(discountId: string): Promise<ProductDiscount[]> {
    return this.repository.find({
      where: {
        discount: {
          id: discountId,
        },
      },
      relations: {
        product: {
          seller: true,
        },
      },
    });
  }

  /**
   * ----------------------------------------------------------------------
   * Find all discounts assigned to a product
   * ----------------------------------------------------------------------
   *
   * Returns all discount assignments belonging to the given product.
   */
  async findAllByProductId(productId: string): Promise<ProductDiscount[]> {
    return this.repository.find({
      where: {
        product: {
          id: productId,
        },
      },
      relations: {
        discount: true,
      },
    });
  }

  /**
   * ----------------------------------------------------------------------
   * Find a specific product-discount assignment
   * ----------------------------------------------------------------------
   *
   * Returns the association between a product and a discount.
   */
  async findByProductIdAndDiscountId(
    productId: string,
    discountId: string,
  ): Promise<ProductDiscount | null> {
    return this.repository.findOne({
      where: {
        product: {
          id: productId,
        },
        discount: {
          id: discountId,
        },
      },
    });
  }

  /**
   * ----------------------------------------------------------------------
   * Find assignment by discount and seller
   * ----------------------------------------------------------------------
   *
   * Used to verify that the discount is attached to
   * at least one product owned by the given seller.
   */
  async findByDiscountIdAndSellerId(
    discountId: string,
    sellerId: string,
  ): Promise<ProductDiscount | null> {
    return this.repository.findOne({
      where: {
        discount: {
          id: discountId,
        },
        product: {
          seller: {
            id: sellerId,
          },
        },
      },
      relations: {
        product: {
          seller: true,
        },
        discount: true,
      },
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Find Product With Seller
   * ------------------------------------------------------------------------
   *
   * Finds a product through the product-discount relationship
   * and loads its seller information.
   *
   * Used to verify that the authenticated seller owns the product.
   */
  async findProductById(productId: string): Promise<ProductDiscount | null> {
    return this.repository.findOne({
      where: {
        product: {
          id: productId,
        },
      },
      relations: {
        product: {
          seller: true,
        },
      },
    });
  }

  /**
   * ----------------------------------------------------------------------
   * Create
   * ----------------------------------------------------------------------
   *
   * Creates a new product-discount association.
   */
  create(data: Partial<ProductDiscount>): ProductDiscount {
    return this.repository.create(data);
  }

  /**
   * ----------------------------------------------------------------------
   * Save
   * ----------------------------------------------------------------------
   *
   * Saves a product-discount association.
   */
  async save(productDiscount: ProductDiscount): Promise<ProductDiscount> {
    return this.repository.save(productDiscount);
  }

  /**
   * ----------------------------------------------------------------------
   * Remove
   * ----------------------------------------------------------------------
   *
   * Removes a product-discount association.
   */
  async remove(productDiscount: ProductDiscount): Promise<void> {
    await this.repository.remove(productDiscount);
  }
}
