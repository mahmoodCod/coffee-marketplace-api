import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CategoriesRepository } from '../repositories/categories.repository';

import { Category } from '../entities/category.entity';

import {
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto';

/**
 * ------------------------------------------------------------------------
 * Categories Service
 * ------------------------------------------------------------------------
 *
 * Handles all business logic related to categories.
 *
 * Responsibilities:
 * - Creating categories
 * - Updating categories
 * - Listing categories
 * - Soft deleting categories
 *
 * Database operations are delegated to CategoriesRepository.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  /**
   * Returns every active category.
   */
  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.categoriesRepository.findAll();

    return categories.map((category) => this.toResponse(category));
  }

  /**
   * Finds one category by UUID.
   */
  async findById(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException(`Category with id "${id}" was not found.`);
    }

    return this.toResponse(category);
  }

  /**
   * ------------------------------------------------------------------------
   * Create Category
   * ------------------------------------------------------------------------
   *
   * Creates a new product category.
   *
   * Business Rules:
   * - Category name must be unique.
   * - Category slug must be unique.
   * - If parentId is provided, it will be stored as the parent category.
   *
   * Returns:
   * Newly created category.
   * ------------------------------------------------------------------------
   */
  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const existingName = await this.categoriesRepository.findByName(dto.name);

    if (existingName) {
      throw new ConflictException('Category name already exists.');
    }

    const existingSlug = await this.categoriesRepository.findBySlug(dto.slug);

    if (existingSlug) {
      throw new ConflictException('Category slug already exists.');
    }

    const category = await this.categoriesRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      parentId: dto.parentId ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });

    return this.toResponse(category);
  }

  /**
   * ------------------------------------------------------------------------
   * Update Category
   * ------------------------------------------------------------------------
   *
   * Updates an existing category.
   *
   * Business Rules:
   * - Category must exist.
   * - Category name must remain unique.
   * - Category slug must remain unique.
   * - Only provided fields are updated.
   *
   * Returns:
   * Updated category.
   * ------------------------------------------------------------------------
   */
  async update(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException(`Category with id "${id}" was not found.`);
    }

    if (dto.name && dto.name !== category.name) {
      const existing = await this.categoriesRepository.findByName(dto.name);

      if (existing) {
        throw new ConflictException('Category name already exists.');
      }

      category.name = dto.name;
    }

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.categoriesRepository.findBySlug(dto.slug);

      if (existing) {
        throw new ConflictException('Category slug already exists.');
      }

      category.slug = dto.slug;
    }

    if (dto.description !== undefined) {
      category.description = dto.description;
    }

    if (dto.parentId !== undefined) {
      category.parentId = dto.parentId;
    }

    if (dto.sortOrder !== undefined) {
      category.sortOrder = dto.sortOrder;
    }

    if (dto.isActive !== undefined) {
      category.isActive = dto.isActive;
    }

    const saved = await this.categoriesRepository.save(category);

    return this.toResponse(saved);
  }

  /**
   * Soft deletes a category.
   */
  async remove(id: string): Promise<void> {
    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      throw new NotFoundException(`Category with id "${id}" was not found.`);
    }

    await this.categoriesRepository.softDelete(category);
  }

  /**
   * ------------------------------------------------------------------------
   * Map Entity To Response DTO
   * ------------------------------------------------------------------------
   *
   * Converts a Category entity into the standard API response model.
   *
   * This method keeps controllers independent from database entities.
   * ------------------------------------------------------------------------
   */
  private toResponse(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
