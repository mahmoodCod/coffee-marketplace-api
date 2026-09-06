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

import { ProductModule } from '../products/products.module';

@Module({
  imports: [
    // Register article-related entities so their repositories can be injected.
    TypeOrmModule.forFeature([Article, ArticleProduct]),

    // Import ProductsModule so ArticlesService can use ProductsService
    // to validate that a product exists before attaching it to an article.
    ProductModule,
  ],

  controllers: [
    // Public endpoints for published articles.
    ArticlesController,

    // Admin endpoints for article management.
    AdminArticlesController,
  ],

  providers: [
    // Main application service responsible for article business logic.
    ArticlesService,

    // Repository responsible for article persistence.
    ArticleRepository,

    // Repository responsible for article-product relationships.
    ArticleProductRepository,
  ],

  exports: [
    // Export article services and repositories for other modules
    // that may need to interact with the article domain.
    ArticlesService,
    ArticleRepository,
    ArticleProductRepository,
  ],
})
export class ArticlesModule {}
