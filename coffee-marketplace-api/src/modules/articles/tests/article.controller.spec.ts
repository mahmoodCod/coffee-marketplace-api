import { Test, TestingModule } from '@nestjs/testing';

import {
  AdminArticlesController,
  ArticlesController,
} from '../controllers/article.controller';
import { ArticlesService } from '../services/article.service';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';
import { Article } from '../entities/article.entity';

describe('ArticlesController', () => {
  let controller: ArticlesController;

  let articlesService: {
    findPublished: jest.Mock;
    findPublishedBySlug: jest.Mock;
  };

  beforeEach(async () => {
    // Mock the service because this controller test focuses only on HTTP
    // request handling and delegation, not on article business logic.
    articlesService = {
      findPublished: jest.fn(),
      findPublishedBySlug: jest.fn(),
    };

    // Create a testing module that contains only the public controller
    // and its mocked service dependency.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticlesController],
      providers: [
        {
          provide: ArticlesService,
          useValue: articlesService,
        },
      ],
    }).compile();

    // Retrieve the controller instance created by NestJS.
    controller = module.get<ArticlesController>(ArticlesController);
  });

  describe('findPublished', () => {
    it('should return published articles', async () => {
      // Arrange: prepare the service response.
      const articles = [
        { id: 'article-1', isPublished: true },
        { id: 'article-2', isPublished: true },
      ] as Article[];

      articlesService.findPublished.mockResolvedValue(articles);

      // Act: call the controller method.
      const result = await controller.findPublished();

      // Assert: verify that the controller delegates to the service.
      expect(result).toEqual(articles);
      expect(articlesService.findPublished).toHaveBeenCalledTimes(1);
    });
  });

  describe('findPublishedBySlug', () => {
    it('should return an article by slug', async () => {
      // Arrange: prepare the service response.
      const article = {
        id: 'article-1',
        slug: 'coffee-guide',
        isPublished: true,
      } as Article;

      articlesService.findPublishedBySlug.mockResolvedValue(article);

      // Act: call the controller method.
      const result = await controller.findPublishedBySlug('coffee-guide');

      // Assert: verify that the slug is passed unchanged.
      expect(result).toBe(article);
      expect(articlesService.findPublishedBySlug).toHaveBeenCalledWith(
        'coffee-guide',
      );
    });
  });
});

describe('AdminArticlesController', () => {
  let controller: AdminArticlesController;

  let articlesService: {
    findAllForAdmin: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    publish: jest.Mock;
    unpublish: jest.Mock;
    remove: jest.Mock;
    attachProduct: jest.Mock;
    detachProduct: jest.Mock;
  };

  beforeEach(async () => {
    // Mock every service method used by the admin controller.
    // This keeps the tests independent from the database and other modules.
    articlesService = {
      findAllForAdmin: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      publish: jest.fn(),
      unpublish: jest.fn(),
      remove: jest.fn(),
      attachProduct: jest.fn(),
      detachProduct: jest.fn(),
    };

    // Create a testing module containing the admin controller and mocked service.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminArticlesController],
      providers: [
        {
          provide: ArticlesService,
          useValue: articlesService,
        },
      ],
    }).compile();

    // Retrieve the admin controller instance from the testing module.
    controller = module.get<AdminArticlesController>(AdminArticlesController);
  });

  describe('findAll', () => {
    it('should return all articles for admin access', async () => {
      // Arrange: prepare the service response including drafts.
      const articles = [
        { id: 'article-1', isPublished: true },
        { id: 'article-2', isPublished: false },
      ] as Article[];

      articlesService.findAllForAdmin.mockResolvedValue(articles);

      // Act: call the admin listing method.
      const result = await controller.findAll();

      // Assert: verify that the admin service method is called.
      expect(result).toEqual(articles);
      expect(articlesService.findAllForAdmin).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return one article by ID', async () => {
      // Arrange: prepare the service response.
      const article = {
        id: 'article-1',
      } as Article;

      articlesService.findOne.mockResolvedValue(article);

      // Act: call the controller method.
      const result = await controller.findOne('article-1');

      // Assert: verify that the ID is passed unchanged.
      expect(result).toBe(article);
      expect(articlesService.findOne).toHaveBeenCalledWith('article-1');
    });
  });

  describe('create', () => {
    it('should pass the authenticated user ID to the service', async () => {
      // Arrange: prepare a valid article creation request.
      const dto: CreateArticleDto = {
        title: 'Coffee Guide',
        slug: 'coffee-guide',
        content: 'Article content',
      };

      const authorId = '11111111-1111-4111-8111-111111111111';

      const article = {
        id: 'article-1',
        author: { id: authorId },
        title: dto.title,
        slug: dto.slug,
        content: dto.content,
        isPublished: false,
      } as Article;

      articlesService.create.mockResolvedValue(article);

      // Act: call the controller with the authenticated user's ID.
      const result = await controller.create(dto, authorId);

      // Assert: verify that the real authenticated ID is passed to the service.
      expect(result).toBe(article);
      expect(articlesService.create).toHaveBeenCalledWith(dto, authorId);
    });
  });

  describe('update', () => {
    it('should pass the article ID and update DTO to the service', async () => {
      // Arrange: prepare an update request.
      const dto: UpdateArticleDto = {
        title: 'Updated Coffee Guide',
      };

      const article = {
        id: 'article-1',
        title: dto.title,
      } as Article;

      articlesService.update.mockResolvedValue(article);

      // Act: call the controller method.
      const result = await controller.update('article-1', dto);

      // Assert: verify that both arguments reach the service unchanged.
      expect(result).toBe(article);
      expect(articlesService.update).toHaveBeenCalledWith('article-1', dto);
    });
  });

  describe('publish', () => {
    it('should delegate publishing to the service', async () => {
      // Arrange: prepare the service response.
      const article = {
        id: 'article-1',
        isPublished: true,
      } as Article;

      articlesService.publish.mockResolvedValue(article);

      // Act: publish the article.
      const result = await controller.publish('article-1');

      // Assert: verify that the publish method is called.
      expect(result).toBe(article);
      expect(articlesService.publish).toHaveBeenCalledWith('article-1');
    });
  });

  describe('unpublish', () => {
    it('should delegate unpublishing to the service', async () => {
      // Arrange: prepare the service response.
      const article = {
        id: 'article-1',
        isPublished: false,
      } as Article;

      articlesService.unpublish.mockResolvedValue(article);

      // Act: unpublish the article.
      const result = await controller.unpublish('article-1');

      // Assert: verify that the unpublish method is called.
      expect(result).toBe(article);
      expect(articlesService.unpublish).toHaveBeenCalledWith('article-1');
    });
  });

  describe('remove', () => {
    it('should delegate article deletion to the service', async () => {
      // Arrange: simulate a successful deletion.
      articlesService.remove.mockResolvedValue(undefined);

      // Act: remove the article.
      await controller.remove('article-1');

      // Assert: verify that the service receives the correct ID.
      expect(articlesService.remove).toHaveBeenCalledWith('article-1');
    });
  });

  describe('attachProduct', () => {
    it('should delegate product attachment to the service', async () => {
      // Arrange: simulate a successful relationship creation.
      articlesService.attachProduct.mockResolvedValue(undefined);

      // Act: attach a product to an article.
      await controller.attachProduct('article-1', 'product-1');

      // Assert: verify that both IDs are passed unchanged.
      expect(articlesService.attachProduct).toHaveBeenCalledWith(
        'article-1',
        'product-1',
      );
    });
  });

  describe('detachProduct', () => {
    it('should delegate product detachment to the service', async () => {
      // Arrange: simulate a successful relationship deletion.
      articlesService.detachProduct.mockResolvedValue(undefined);

      // Act: detach a product from an article.
      await controller.detachProduct('article-1', 'product-1');

      // Assert: verify that both IDs are passed unchanged.
      expect(articlesService.detachProduct).toHaveBeenCalledWith(
        'article-1',
        'product-1',
      );
    });
  });
});
