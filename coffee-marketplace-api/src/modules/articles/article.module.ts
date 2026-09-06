import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  ArticlesController,
  AdminArticlesController,
} from './controllers/article.controller';
import { ArticlesService } from './services/article.service';

import { Article } from './entities/article.entity';
import { ArticleProduct } from './entities/article-product.entity';

import { ArticleRepository } from './repositories/article.repository';

@Module({
  imports: [
    // Register Article entities so TypeORM can inject their repositories
    // and manage their database operations inside this module.
    TypeOrmModule.forFeature([Article, ArticleProduct]),
  ],

  controllers: [
    // Public endpoints for reading published articles.
    ArticlesController,

    // Administrative endpoints for creating, updating,
    // publishing, unpublishing and deleting articles.
    AdminArticlesController,
  ],

  providers: [
    // Register the service so NestJS can inject it into the controllers.
    ArticlesService,

    // Register the custom repository so the service can use
    // database access methods through dependency injection.
    ArticleRepository,
  ],

  exports: [
    // Export the service so other modules can use article-related
    // business logic without accessing the database directly.
    ArticlesService,

    // Export the repository only when another module needs
    // direct access to article persistence operations.
    ArticleRepository,
  ],
})
export class ArticlesModule {}
