import { ConflictException, NotFoundException } from '@nestjs/common';

import { ArticlesService } from '../services/article.service';
import { Article } from '../entities/article.entity';
import { ArticleRepository } from '../repositories/article.repository';
import { ArticleProductRepository } from '../repositories/article-product.repository';
import { ProductService } from '../../../modules/products/services/product.service';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';

describe('ArticlesService', () => {
  let service: ArticlesService;

  let articleRepository: {
    findBySlug: jest.Mock;
    findById: jest.Mock;
    findPublished: jest.Mock;
    findAllForAdmin: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    softDelete: jest.Mock;
  };

  let articleProductRepository: {
    exists: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };

  let productsService: {
    findOne: jest.Mock;
  };

  beforeEach(() => {
    // Mock the article repository so service tests do not require a database.
    // Each repository method is replaced with a Jest mock that can be controlled
    // independently inside every test.
    articleRepository = {
      findBySlug: jest.fn(),
      findById: jest.fn(),
      findPublished: jest.fn(),
      findAllForAdmin: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      softDelete: jest.fn(),
    };

    // Mock the junction repository used to manage article-product relationships.
    // These mocks allow us to test duplicate detection and relationship deletion
    // without inserting records into the article_products table.
    articleProductRepository = {
      exists: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };

    // Mock the product service because ArticlesService only needs its findOne
    // method to verify that an attached product actually exists.
    productsService = {
      findOne: jest.fn(),
    };

    // Create the service with the mocked dependencies.
    // This reproduces NestJS dependency injection without starting the application.
    service = new ArticlesService(
      articleRepository as ArticleRepository,
      articleProductRepository as ArticleProductRepository,
      productsService as ProductService,
    );
  });

  describe('create', () => {
    it('should create a new article as a draft', async () => {
      // Arrange: prepare a valid article creation request.
      const dto: CreateArticleDto = {
        title: 'Coffee Brewing Guide',
        slug: 'coffee-brewing-guide',
        content: 'A guide to brewing coffee.',
      };

      const authorId = '11111111-1111-4111-8111-111111111111';

      // No existing article should use this slug.
      articleRepository.findBySlug.mockResolvedValue(null);

      // Return the same entity that the repository receives.
      // This allows us to inspect the values prepared by the service.
      articleRepository.create.mockImplementation(
        async (article: Article) => article,
      );

      // Act: create the article through the service.
      const result = await service.create(dto, authorId);

      // Assert: verify that the service prepares the correct entity.
      expect(result.title).toBe(dto.title);
      expect(result.slug).toBe(dto.slug);
      expect(result.content).toBe(dto.content);

      // The author must come from the authenticated user.
      expect(result.author.id).toBe(authorId);

      // New articles must always start as drafts.
      expect(result.isPublished).toBe(false);
      expect(result.publishedAt).toBeNull();

      // Missing optional values must be normalized to null.
      expect(result.excerpt).toBeNull();
      expect(result.thumbnail).toBeNull();
      expect(result.badge).toBeNull();
      expect(result.readTime).toBeNull();

      // Verify that persistence was delegated to the repository.
      expect(articleRepository.create).toHaveBeenCalledTimes(1);
      expect(articleRepository.create).toHaveBeenCalledWith(
        expect.any(Article),
      );
    });

    it('should preserve optional article fields when provided', async () => {
      // Arrange: provide optional fields that should be stored unchanged.
      const dto: CreateArticleDto = {
        title: 'Coffee Equipment',
        slug: 'coffee-equipment',
        content: 'A guide to coffee equipment.',
        excerpt: 'Learn about coffee equipment.',
        thumbnail: 'https://example.com/coffee.jpg',
        badge: 'Equipment',
        readTime: 5,
      };

      const authorId = '22222222-2222-4222-8222-222222222222';

      articleRepository.findBySlug.mockResolvedValue(null);

      articleRepository.create.mockImplementation(
        async (article: Article) => article,
      );

      // Act: create the article.
      const result = await service.create(dto, authorId);

      // Assert: verify that optional values are preserved.
      expect(result.excerpt).toBe(dto.excerpt);
      expect(result.thumbnail).toBe(dto.thumbnail);
      expect(result.badge).toBe(dto.badge);
      expect(result.readTime).toBe(dto.readTime);
    });

    it('should reject duplicate article slugs', async () => {
      const dto: CreateArticleDto = {
        title: 'Coffee Brewing Guide',
        slug: 'coffee-brewing-guide',
        content: 'A guide to brewing coffee.',
      };

      articleRepository.findBySlug.mockResolvedValue({
        id: 'existing-article',
        slug: dto.slug,
      } as Article);

      await expect(
        service.create(dto, '11111111-1111-4111-8111-111111111111'),
      ).rejects.toThrow(ConflictException);

      expect(articleRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findPublished', () => {
    it('should return published articles from the repository', async () => {
      // Arrange: prepare the articles returned by the repository.
      const articles = [
        { id: 'article-1', isPublished: true },
        { id: 'article-2', isPublished: true },
      ] as Article[];

      articleRepository.findPublished.mockResolvedValue(articles);

      // Act: retrieve published articles.
      const result = await service.findPublished();

      // Assert: verify that the repository result is returned unchanged.
      expect(result).toEqual(articles);
      expect(articleRepository.findPublished).toHaveBeenCalledTimes(1);
    });
  });

  describe('findPublishedBySlug', () => {
    it('should return a published article when the slug exists', async () => {
      // Arrange: prepare a published article.
      const article = {
        id: 'article-1',
        slug: 'coffee-guide',
        isPublished: true,
      } as Article;

      articleRepository.findBySlug.mockResolvedValue(article);

      // Act: find the article by slug.
      const result = await service.findPublishedBySlug('coffee-guide');

      // Assert: published articles should be returned.
      expect(result).toBe(article);
      expect(articleRepository.findBySlug).toHaveBeenCalledWith('coffee-guide');
    });

    it('should throw NotFoundException when the article does not exist', async () => {
      // Arrange: simulate a missing article.
      articleRepository.findBySlug.mockResolvedValue(null);

      // Act and assert: public lookup must fail with 404.
      await expect(
        service.findPublishedBySlug('missing-article'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when the article is a draft', async () => {
      // Arrange: simulate an existing but unpublished article.
      const draft = {
        id: 'article-1',
        slug: 'draft-article',
        isPublished: false,
      } as Article;

      articleRepository.findBySlug.mockResolvedValue(draft);

      // Act and assert: drafts must remain hidden from public access.
      await expect(
        service.findPublishedBySlug('draft-article'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllForAdmin', () => {
    it('should return all articles including drafts', async () => {
      // Arrange: Admin access must include both published and draft articles.
      const articles = [
        { id: 'article-1', isPublished: true },
        { id: 'article-2', isPublished: false },
      ] as Article[];

      articleRepository.findAllForAdmin.mockResolvedValue(articles);

      // Act: retrieve all articles for administrative management.
      const result = await service.findAllForAdmin();

      // Assert: verify that drafts are not filtered out.
      expect(result).toEqual(articles);
      expect(articleRepository.findAllForAdmin).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return an article when the ID exists', async () => {
      // Arrange: prepare an existing article.
      const article = {
        id: 'article-1',
      } as Article;

      articleRepository.findById.mockResolvedValue(article);

      // Act: find the article by ID.
      const result = await service.findOne('article-1');

      // Assert: return the existing article.
      expect(result).toBe(article);
    });

    it('should throw NotFoundException when the ID does not exist', async () => {
      // Arrange: simulate a missing article.
      articleRepository.findById.mockResolvedValue(null);

      // Act and assert: missing articles must produce a consistent 404 error.
      await expect(service.findOne('missing-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update only the supplied fields', async () => {
      // Arrange: prepare an existing article.
      const article = {
        id: 'article-1',
        title: 'Old title',
        slug: 'old-slug',
        content: 'Old content',
        isPublished: false,
      } as Article;

      const dto: UpdateArticleDto = {
        title: 'Updated title',
      };

      articleRepository.findById.mockResolvedValue(article);
      articleRepository.findBySlug.mockResolvedValue(null);
      articleRepository.save.mockImplementation(
        async (updatedArticle: Article) => updatedArticle,
      );

      // Act: update the article.
      const result = await service.update('article-1', dto);

      // Assert: supplied fields should change.
      expect(result.title).toBe('Updated title');

      // Fields not supplied in the PATCH request should remain unchanged.
      expect(result.slug).toBe('old-slug');
      expect(result.content).toBe('Old content');

      // Publication state must not be changed by the update method.
      expect(result.isPublished).toBe(false);

      expect(articleRepository.save).toHaveBeenCalledWith(article);
    });
  });

  describe('remove', () => {
    it('should soft-delete an existing article', async () => {
      // Arrange: simulate an existing article.
      articleRepository.findById.mockResolvedValue({
        id: 'article-1',
      });

      articleRepository.softDelete.mockResolvedValue(undefined);

      // Act: remove the article.
      await service.remove('article-1');

      // Assert: verify that the service uses soft delete.
      expect(articleRepository.softDelete).toHaveBeenCalledWith('article-1');
      expect(articleRepository.softDelete).toHaveBeenCalledTimes(1);
    });

    it('should not delete an article that does not exist', async () => {
      // Arrange: simulate a missing article.
      articleRepository.findById.mockResolvedValue(null);

      // Act and assert: the service must stop before calling softDelete.
      await expect(service.remove('missing-id')).rejects.toThrow(
        NotFoundException,
      );

      expect(articleRepository.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('publish', () => {
    it('should publish an article and set its first publication date', async () => {
      // Arrange: prepare an unpublished article.
      const article = {
        id: 'article-1',
        isPublished: false,
        publishedAt: null,
      } as Article;

      articleRepository.findById.mockResolvedValue(article);
      articleRepository.save.mockImplementation(
        async (updatedArticle: Article) => updatedArticle,
      );

      // Act: publish the article.
      const result = await service.publish('article-1');

      // Assert: verify publication state and first publication date.
      expect(result.isPublished).toBe(true);
      expect(result.publishedAt).toBeInstanceOf(Date);

      expect(articleRepository.save).toHaveBeenCalledWith(article);
    });

    it('should preserve the original publication date when publishing again', async () => {
      // Arrange: prepare an article that was published before.
      const originalPublishedAt = new Date('2026-01-01T00:00:00.000Z');

      const article = {
        id: 'article-1',
        isPublished: false,
        publishedAt: originalPublishedAt,
      } as Article;

      articleRepository.findById.mockResolvedValue(article);
      articleRepository.save.mockImplementation(
        async (updatedArticle: Article) => updatedArticle,
      );

      // Act: publish the article again.
      const result = await service.publish('article-1');

      // Assert: the original publication date must remain unchanged.
      expect(result.publishedAt).toBe(originalPublishedAt);
    });
  });

  describe('unpublish', () => {
    it('should unpublish an article without clearing publishedAt', async () => {
      // Arrange: prepare a published article.
      const originalPublishedAt = new Date('2026-01-01T00:00:00.000Z');

      const article = {
        id: 'article-1',
        isPublished: true,
        publishedAt: originalPublishedAt,
      } as Article;

      articleRepository.findById.mockResolvedValue(article);
      articleRepository.save.mockImplementation(
        async (updatedArticle: Article) => updatedArticle,
      );

      // Act: unpublish the article.
      const result = await service.unpublish('article-1');

      // Assert: visibility changes but the first publication date remains.
      expect(result.isPublished).toBe(false);
      expect(result.publishedAt).toBe(originalPublishedAt);
    });
  });

  describe('attachProduct', () => {
    it('should attach an existing product to an article', async () => {
      // Arrange: verify that both article and product exist.
      articleRepository.findById.mockResolvedValue({
        id: 'article-1',
      });

      productsService.findOne.mockResolvedValue({
        id: 'product-1',
      });

      articleProductRepository.exists.mockResolvedValue(false);
      articleProductRepository.create.mockResolvedValue(undefined);

      // Act: attach the product.
      await service.attachProduct('article-1', 'product-1');

      // Assert: verify the validation and relationship creation flow.
      expect(productsService.findOne).toHaveBeenCalledWith('product-1');
      expect(articleProductRepository.exists).toHaveBeenCalledWith(
        'article-1',
        'product-1',
      );
      expect(articleProductRepository.create).toHaveBeenCalledWith(
        'article-1',
        'product-1',
      );
    });

    it('should throw ConflictException when the relationship already exists', async () => {
      // Arrange: simulate an existing article-product relationship.
      articleRepository.findById.mockResolvedValue({
        id: 'article-1',
      });

      productsService.findOne.mockResolvedValue({
        id: 'product-1',
      });

      articleProductRepository.exists.mockResolvedValue(true);

      // Act and assert: duplicate relationships must be rejected.
      await expect(
        service.attachProduct('article-1', 'product-1'),
      ).rejects.toThrow(ConflictException);

      expect(articleProductRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('detachProduct', () => {
    it('should detach an existing product relationship', async () => {
      // Arrange: simulate an existing article and relationship.
      articleRepository.findById.mockResolvedValue({
        id: 'article-1',
      });

      articleProductRepository.exists.mockResolvedValue(true);
      articleProductRepository.delete.mockResolvedValue(undefined);

      // Act: detach the product.
      await service.detachProduct('article-1', 'product-1');

      // Assert: verify that only the relationship is deleted.
      expect(articleProductRepository.delete).toHaveBeenCalledWith(
        'article-1',
        'product-1',
      );
    });

    it('should throw NotFoundException when the relationship does not exist', async () => {
      // Arrange: simulate an existing article without the requested relationship.
      articleRepository.findById.mockResolvedValue({
        id: 'article-1',
      });

      articleProductRepository.exists.mockResolvedValue(false);

      // Act and assert: missing relationships must produce a 404 error.
      await expect(
        service.detachProduct('article-1', 'product-1'),
      ).rejects.toThrow(NotFoundException);

      expect(articleProductRepository.delete).not.toHaveBeenCalled();
    });
  });
});
