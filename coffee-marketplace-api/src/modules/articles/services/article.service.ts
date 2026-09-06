import { Injectable, NotFoundException } from '@nestjs/common';

import { ArticleRepository } from '../repositories/article.repository';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { Article } from '../entities/article.entity';

@Injectable()
export class ArticlesService {
  constructor(private readonly articleRepository: ArticleRepository) {}

  /**
   * Creates a new article.
   *
   * The author is taken from the authenticated user instead of the request body.
   * This prevents clients from creating articles on behalf of another user.
   *
   * New articles are created as drafts.
   * Publication is handled separately by the publish method.
   */
  async create(
    createArticleDto: CreateArticleDto,
    authorId: string,
  ): Promise<Article> {
    // Create a new Article entity in memory.
    // At this stage, the article has not been stored in the database.
    const article = new Article();

    // Assign the authenticated user as the article author.
    // The client cannot choose another author through the DTO.
    article.author = { id: authorId } as Article['author'];

    // Copy the article content fields from the validated request.
    // DTO validation has already checked the incoming data before this method runs.
    article.title = createArticleDto.title;
    article.slug = createArticleDto.slug;
    article.excerpt = createArticleDto.excerpt;
    article.content = createArticleDto.content;
    article.thumbnail = createArticleDto.thumbnail;
    article.badge = createArticleDto.badge;
    article.readTime = createArticleDto.readTime;

    // New articles must start as drafts.
    // Drafts are not visible through public article endpoints.
    article.isPublished = false;

    // A draft has not been published yet, so it has no publication date.
    article.publishedAt = null;

    // Persist the completed entity through the repository.
    // Keeping database access inside the repository prevents the service
    // from depending directly on TypeORM's Repository API.
    return this.articleRepository.create(article);
  }

  /**
   * Returns all published articles for public access.
   *
   * The repository applies the publication filter and sorting.
   * Draft articles must never be returned by this method.
   */
  async findPublished(): Promise<Article[]> {
    // Retrieve only articles that are currently published.
    // This method is used by public endpoints such as GET /articles.
    return this.articleRepository.findPublished();
  }

  /**
   * Returns one published article by its slug.
   *
   * Slugs are used in public URLs because they are more readable than UUIDs.
   * If the article does not exist or is still a draft, the same NotFoundException
   * is returned so private article existence is not exposed.
   */
  async findPublishedBySlug(slug: string): Promise<Article> {
    // Find the article using its unique slug.
    const article = await this.articleRepository.findBySlug(slug);

    // Public users must not be able to access drafts.
    // Returning the same error for both cases avoids exposing draft information.
    if (!article || !article.isPublished) {
      throw new NotFoundException('Article not found');
    }

    // Return the published article to the controller.
    return article;
  }

  /**
   * Returns all articles for administrative access.
   *
   * Unlike public queries, this method also returns drafts.
   * Authorization will be handled by the controller and guards.
   */
  async findAllForAdmin(): Promise<Article[]> {
    // Retrieve all articles, including drafts, for admin management.
    return this.articleRepository.findAllForAdmin();
  }

  /**
   * Finds one article by its ID.
   *
   * This method is used by administrative operations such as update and delete.
   * It throws a consistent exception when the article does not exist.
   */
  async findOne(id: string): Promise<Article> {
    // Search for the article using its UUID.
    const article = await this.articleRepository.findById(id);

    // Stop the operation if the requested article does not exist.
    // The controller can return this exception as an HTTP 404 response.
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  /**
   * Updates an existing article.
   *
   * UpdateArticleDto contains optional fields because PATCH requests
   * should modify only the fields supplied by the client.
   *
   * Publication state is intentionally not changed here.
   * Publishing and unpublishing must follow their own business rules.
   */
  async update(
    id: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<Article> {
    // Reuse findOne so the update operation fails consistently
    // when the article does not exist.
    const article = await this.findOne(id);

    // Apply only the fields provided in the PATCH request.
    // Undefined fields are not included in the DTO transformation.
    Object.assign(article, updateArticleDto);

    // Save the updated entity through the repository.
    return this.articleRepository.save(article);
  }

  /**
   * Soft-deletes an article.
   *
   * Soft delete keeps the database record but sets deletedAt.
   * This allows the system to preserve historical data and recover
   * the article later if necessary.
   */
  async remove(id: string): Promise<void> {
    // Verify that the article exists before attempting to delete it.
    await this.findOne(id);

    // Mark the article as deleted without permanently removing its record.
    await this.articleRepository.softDelete(id);
  }

  /**
   * Publishes an article.
   *
   * An article can be published multiple times during its lifetime.
   * However, publishedAt must represent the first time the article
   * was ever published, so it must not be overwritten on later publishes.
   */
  async publish(id: string): Promise<Article> {
    // Find the article before changing its publication state.
    const article = await this.findOne(id);

    // Mark the article as publicly visible.
    article.isPublished = true;

    // Store the first publication date only.
    // If the article has already been published before,
    // keep the original publishedAt value.
    if (!article.publishedAt) {
      article.publishedAt = new Date();
    }

    // Persist the publication state and publication date.
    return this.articleRepository.save(article);
  }

  /**
   * Unpublishes an article.
   *
   * Unpublishing only hides the article from public users.
   * The original publishedAt value is intentionally preserved
   * so the system knows when the article was first published.
   */
  async unpublish(id: string): Promise<Article> {
    // Find the article before changing its publication state.
    const article = await this.findOne(id);

    // Hide the article from public endpoints.
    article.isPublished = false;

    // Do not clear publishedAt.
    // The field represents the first publication date, not the current state.

    // Persist the updated publication state.
    return this.articleRepository.save(article);
  }
}
