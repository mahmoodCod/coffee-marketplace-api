import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Article } from './article.entity';
import { Product } from '../../products/entities/product.entity';

/**
 * ------------------------------------------------------------------------
 * Article Product Entity
 * ------------------------------------------------------------------------
 *
 * Represents the many-to-many relationship between articles and products.
 *
 * Database Table:
 * article_products
 *
 * Business Rules
 * ------------------------------------------------------------------------
 * - An article can be linked to many products.
 * - A product can appear in many articles.
 * - The same product cannot be attached to the same article twice.
 * ------------------------------------------------------------------------
 */
@Entity({
  name: 'article_products',
})
export class ArticleProduct {
  /**
   * Article identifier.
   *
   * Composite primary key part 1.
   */
  @PrimaryColumn({
    name: 'article_id',
    type: 'uuid',
  })
  articleId: string;

  /**
   * Product identifier.
   *
   * Composite primary key part 2.
   */
  @PrimaryColumn({
    name: 'product_id',
    type: 'uuid',
  })
  productId: string;

  /**
   * Article relationship.
   */
  @ManyToOne(() => Article, (article) => article.products, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'article_id',
  })
  article: Article;

  /**
   * Product relationship.
   */
  @ManyToOne(() => Product, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'product_id',
  })
  product: Product;
}
