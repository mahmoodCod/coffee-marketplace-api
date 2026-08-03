import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Category } from './entities/category.entity';

import { CategoriesRepository } from './repositories/categories.repository';

import { CategoriesService } from './services/categories.service';

import { CategoriesController } from './controllers/categories.controller';

/**
 * ------------------------------------------------------------------------
 * Categories Module
 * ------------------------------------------------------------------------
 *
 * Registers every component required for category management.
 *
 * Responsibilities:
 * - Register Category entity
 * - Register Repository layer
 * - Register Service layer
 * - Register Controller layer
 *
 * Future Extensions:
 * - Product ↔ Category relationships
 * - Category hierarchy
 * - Category statistics
 * ------------------------------------------------------------------------
 */
@Module({
  imports: [TypeOrmModule.forFeature([Category])],

  controllers: [CategoriesController],

  providers: [CategoriesRepository, CategoriesService],

  exports: [CategoriesRepository, CategoriesService],
})
export class CategoriesModule {}
