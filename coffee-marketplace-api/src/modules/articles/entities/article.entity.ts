import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { ArticleProduct } from '../entities/article-product.entity';

/**
 * ------------------------------------------------------------------------
 * Article Entity
 * ------------------------------------------------------------------------
 *
 * Represents educational and content articles managed by administrators.
 *
 * Business Rules
 * ------------------------------------------------------------------------
 * - Every article belongs to one author.
 * - Only administrators can create and manage articles.
 * - Only published articles are visible to guests and customers.
 * - Article slugs must be unique.
 * - Articles can be linked to multiple products.
 *
 * Notes
 * ------------------------------------------------------------------------
 * Product relationships are managed through ArticleProduct.
 * ------------------------------------------------------------------------
 */
@Entity({
  name: 'articles',
})
export class Article {
  /**
   * Article unique identifier.
   */
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Administrator who created the article.
   *
   * Relationship:
   *
   * User 1 ---- N Article
   */
  @ManyToOne(() => User, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'author_id',
  })
  author: User;

  /**
   * Article title.
   */
  @Column({
    type: 'varchar',
    length: 200,
  })
  title: string;

  /**
   * SEO-friendly public identifier.
   *
   * Used in public article URLs.
   */
  @Column({
    type: 'varchar',
    length: 220,
    unique: true,
  })
  slug: string;

  /**
   * Short article summary.
   *
   * Used in article listings and cards.
   */
  @Column({
    type: 'text',
    nullable: true,
  })
  excerpt: string | null;

  /**
   * Full article body.
   */
  @Column({
    type: 'text',
  })
  content: string;

  /**
   * Optional article cover image.
   */
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  thumbnail: string | null;

  /**
   * Optional label displayed on the article card.
   *
   * Examples:
   * - Guide
   * - New
   */
  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  badge: string | null;

  /**
   * Estimated reading time in minutes.
   */
  @Column({
    name: 'read_time',
    type: 'integer',
    nullable: true,
  })
  readTime: number | null;

  /**
   * Controls public article visibility.
   *
   * false = Draft
   * true = Published
   */
  @Column({
    name: 'is_published',
    type: 'boolean',
    default: false,
  })
  isPublished: boolean;

  /**
   * First publication timestamp.
   *
   * Remains unchanged when the article is unpublished
   * and published again.
   */
  @Column({
    name: 'published_at',
    type: 'timestamp',
    nullable: true,
  })
  publishedAt: Date | null;

  /**
   * Products related to this article.
   *
   * Relationship:
   *
   * Article 1 ---- N ArticleProduct
   */
  @OneToMany(() => ArticleProduct, (articleProduct) => articleProduct.article)
  products: ArticleProduct[];

  /**
   * Creation timestamp.
   */
  @CreateDateColumn({
    name: 'created_at',
  })
  createdAt: Date;

  /**
   * Last update timestamp.
   */
  @UpdateDateColumn({
    name: 'updated_at',
  })
  updatedAt: Date;

  /**
   * Soft delete timestamp.
   */
  @DeleteDateColumn({
    name: 'deleted_at',
  })
  deletedAt: Date | null;
}
