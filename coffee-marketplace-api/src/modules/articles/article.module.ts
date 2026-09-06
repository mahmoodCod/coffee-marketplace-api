import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  AdminArticlesController,
  ArticlesController,
} from './controllers/article.controller';

import { ArticlesService } from './services/article.service';

import { Article } from './entities/article.entity';
import { ArticleProduct } from './entities/article-product.entity';

import { ArticleRepository } from './repositories/article.repository';
import { ArticleProductRepository } from './repositories/article-product.repository';

@Module({
  imports: [
    // Register Article and ArticleProduct entities with TypeORM.
    // This allows NestJS to inject their TypeORM repositories
    // into the custom repository classes.
    TypeOrmModule.forFeature([Article, ArticleProduct]),
  ],

  controllers: [
    // Register public article endpoints.
    ArticlesController,

    // Register administrative article management endpoints.
    AdminArticlesController,
  ],

  providers: [
    // Register the service containing Article business logic.
    ArticlesService,

    // Register the repository responsible for Article persistence.
    ArticleRepository,

    // Register the repository responsible for Article-Product relationships.
    ArticleProductRepository,
  ],

  exports: [
    // Export the service so other modules can use article business logic.
    ArticlesService,

    // Export the Article repository for modules that need article persistence.
    ArticleRepository,

    // Export the junction repository for modules that need
    // to manage Article-Product relationships.
    ArticleProductRepository,
  ],
})
export class ArticlesModule {}
