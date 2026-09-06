import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ArticleProduct } from '../entities/article-product.entity';

@Injectable()
export class ArticleProductRepository {
  constructor(
    @InjectRepository(ArticleProduct)
    private readonly repository: Repository<ArticleProduct>,
  ) {}

  /**
   * Checks whether a specific product is already attached to an article.
   *
   * The article_id and product_id combination is the composite primary key
   * of article_products, so each article-product relationship must be unique.
   *
   * This method is used before creating a new relationship to prevent
   * duplicate attachments.
   */
  async exists(articleId: string, productId: string): Promise<boolean> {
    // Search for the relationship using both parts of the composite key.
    const relation = await this.repository.findOne({
      where: {
        articleId,
        productId,
      },
    });

    // Return true when the relationship already exists.
    return !!relation;
  }

  /**
   * Creates a relationship between an article and a product.
   *
   * The actual Article and Product records are not created here.
   * This method only creates their relationship inside article_products.
   */
  async create(articleId: string, productId: string): Promise<ArticleProduct> {
    // Create a new junction entity containing both foreign keys.
    const relation = this.repository.create({
      articleId,
      productId,
    });

    // Persist the relationship in the database.
    return this.repository.save(relation);
  }

  /**
   * Removes the relationship between an article and a product.
   *
   * Only the junction record is deleted.
   * The original article and product remain unchanged.
   */
  async delete(articleId: string, productId: string): Promise<void> {
    // Delete the junction record using the composite primary key.
    await this.repository.delete({
      articleId,
      productId,
    });
  }
}
