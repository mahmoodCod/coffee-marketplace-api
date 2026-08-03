import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Category } from '../entities/category.entity';

/**
 * ------------------------------------------------------------------------
 * Categories Repository
 * ------------------------------------------------------------------------
 *
 * Handles all database operations related to categories.
 *
 * Responsibilities:
 * - Reading categories
 * - Creating categories
 * - Updating categories
 * - Soft deleting categories
 *
 * Business rules MUST NOT exist here.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  /**
   * Returns all active categories.
   */
  async findAll(): Promise<Category[]> {
    return this.repository.find({
      where: {
        deletedAt: IsNull(),
      },
      order: {
        sortOrder: 'ASC',
      },
    });
  }

  /**
   * Finds one category by UUID.
   */
  async findById(id: string): Promise<Category | null> {
    return this.repository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * Finds one category by name.
   */
  async findByName(name: string): Promise<Category | null> {
    return this.repository.findOne({
      where: {
        name,
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * Finds one category by slug.
   */
  async findBySlug(slug: string): Promise<Category | null> {
    return this.repository.findOne({
      where: {
        slug,
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * Creates a new category.
   */
  async create(payload: Partial<Category>): Promise<Category> {
    const entity = this.repository.create(payload);

    return this.repository.save(entity);
  }

  /**
   * Saves an existing category.
   */
  async save(category: Category): Promise<Category> {
    return this.repository.save(category);
  }

  /**
   * Soft deletes a category.
   */
  async softDelete(category: Category): Promise<void> {
    await this.repository.softRemove(category);
  }
}
