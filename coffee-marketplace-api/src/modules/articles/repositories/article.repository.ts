import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Article } from '../entities/article.entity';

@Injectable()
export class ArticleRepository {
  constructor(
    @InjectRepository(Article)
    private readonly repository: Repository<Article>,
  ) {}

  // Find an article by its unique slug
  async findBySlug(slug: string): Promise<Article | null> {
    return this.repository.findOne({
      where: { slug },
    });
  }

  // Find an article by its ID
  async findById(id: string): Promise<Article | null> {
    return this.repository.findOne({
      where: { id },
    });
  }

  // Find all published articles for public access
  async findPublished(): Promise<Article[]> {
    return this.repository.find({
      where: {
        isPublished: true,
      },
      order: {
        publishedAt: 'DESC',
      },
    });
  }

  // Find all articles for admin access, including drafts
  async findAllForAdmin(): Promise<Article[]> {
    return this.repository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // Create a new article
  async create(article: Article): Promise<Article> {
    return this.repository.save(article);
  }

  // Update an existing article
  async save(article: Article): Promise<Article> {
    return this.repository.save(article);
  }

  // Soft delete an article
  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
