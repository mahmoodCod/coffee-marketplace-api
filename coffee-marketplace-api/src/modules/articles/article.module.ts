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

@Module({
  imports: [
    // Register Article and ArticleProduct with TypeORM.
    // This makes their database repositories available inside
    // the ArticlesModule through dependency injection.
    TypeOrmModule.forFeature([Article, ArticleProduct]),
  ],

  controllers: [
    // Register the public controller responsible for
    // exposing published articles to customers and guests.
    ArticlesController,

    // Register the admin controller responsible for
    // article management operations such as create, update,
    // publish, unpublish and delete.
    AdminArticlesController,
  ],

  providers: [
    // Register the service that contains the business logic
    // for creating, reading, updating and publishing articles.
    ArticlesService,

    // Register the custom repository responsible for
    // communicating with the database.
    ArticleRepository,
  ],

  exports: [
    // Export the service so other modules can use
    // article-related business operations when required.
    ArticlesService,

    // Export the repository for modules that may need
    // direct access to article persistence operations.
    ArticleRepository,
  ],
})
export class ArticlesModule {}
