import { Injectable } from '@nestjs/common';

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
}
