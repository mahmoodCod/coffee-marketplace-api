import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Article } from './entities/article.entity';
import { ArticleProduct } from './entities/article-product.entity';
import { ArticleRepository } from './repositories/article.repository';

@Module({
  imports: [
    // Register Article entities for TypeORM
    TypeOrmModule.forFeature([Article, ArticleProduct]),
  ],
  providers: [
    // Make ArticleRepository available for dependency injection
    ArticleRepository,
  ],
  exports: [
    // Allow other modules to use ArticleRepository when needed
    ArticleRepository,
  ],
})
export class ArticlesModule {}
