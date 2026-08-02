import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CategoriesService } from '../services/categories.service';

import {
  CategoryResponseDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from '../dto';

/**
 * ------------------------------------------------------------------------
 * Categories Controller
 * ------------------------------------------------------------------------
 *
 * Handles HTTP requests related to product categories.
 *
 * Responsibilities:
 * - Retrieve categories
 * - Retrieve category details
 * - Create categories
 * - Update categories
 * - Soft delete categories
 *
 * Notes:
 * Public endpoints:
 * - GET /categories
 * - GET /categories/:id
 *
 * Protected endpoints:
 * - POST /admin/categories
 * - PATCH /admin/categories/:id
 * - DELETE /admin/categories/:id
 *
 * Authentication and authorization will be added later.
 * ------------------------------------------------------------------------
 */

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * ------------------------------------------------------------------------
   * Get All Categories
   * ------------------------------------------------------------------------
   *
   * Returns every active category.
   * ------------------------------------------------------------------------
   */
  @Get()
  @ApiOperation({
    summary: 'Get all categories',
  })
  @ApiOkResponse({
    type: CategoryResponseDto,
    isArray: true,
  })
  async findAll(): Promise<CategoryResponseDto[]> {
    return this.categoriesService.findAll();
  }

  /**
   * ------------------------------------------------------------------------
   * Get Category By Id
   * ------------------------------------------------------------------------
   *
   * Returns category details.
   * ------------------------------------------------------------------------
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get category by id',
  })
  @ApiOkResponse({
    type: CategoryResponseDto,
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.findById(id);
  }

  /**
   * ------------------------------------------------------------------------
   * Create Category
   * ------------------------------------------------------------------------
   *
   * Creates a new product category.
   *
   * NOTE:
   * This endpoint will later be protected
   * and only accessible by administrators.
   * ------------------------------------------------------------------------
   */
  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create category',
  })
  @ApiCreatedResponse({
    type: CategoryResponseDto,
  })
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.categoriesService.create(dto);
  }

  /**
   * ------------------------------------------------------------------------
   * Update Category
   * ------------------------------------------------------------------------
   *
   * Updates an existing category.
   *
   * NOTE:
   * This endpoint will later be protected
   * and only accessible by administrators.
   * ------------------------------------------------------------------------
   */
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update category',
  })
  @ApiOkResponse({
    type: CategoryResponseDto,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.categoriesService.update(id, dto);
  }

  /**
   * ------------------------------------------------------------------------
   * Delete Category
   * ------------------------------------------------------------------------
   *
   * Soft deletes a category.
   *
   * NOTE:
   * This endpoint will later be protected
   * and only accessible by administrators.
   * ------------------------------------------------------------------------
   */
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete category',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.categoriesService.remove(id);
  }
}
