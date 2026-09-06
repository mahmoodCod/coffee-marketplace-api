import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ArticlesService } from '../services/article.service';
import { CreateArticleDto } from '../dto/create-article.dto';
import { UpdateArticleDto } from '../dto/update-article.dto';

@ApiTags('Articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  /**
   * Returns all published articles.
   *
   * This endpoint is public and must never expose draft articles.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all published articles',
    description:
      'Returns all articles that are currently published and visible to public users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Published articles returned successfully.',
  })
  async findPublished() {
    return this.articlesService.findPublished();
  }

  /**
   * Returns one published article by its slug.
   *
   * The service verifies that the article exists and is published
   * before returning it to the public.
   */
  @Get(':slug')
  @ApiOperation({
    summary: 'Get a published article by slug',
    description:
      'Returns a single published article using its unique URL-friendly slug.',
  })
  @ApiParam({
    name: 'slug',
    example: 'how-to-choose-the-right-coffee-beans',
    description: 'Unique URL-friendly article slug.',
  })
  @ApiResponse({
    status: 200,
    description: 'Published article returned successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found or the article is still a draft.',
  })
  async findPublishedBySlug(@Param('slug') slug: string) {
    return this.articlesService.findPublishedBySlug(slug);
  }
}

@ApiTags('Admin - Articles')
@ApiBearerAuth()
@Controller('admin/articles')
export class AdminArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  /**
   * Returns all articles for administrative management.
   *
   * Unlike the public endpoint, this includes both published
   * articles and drafts.
   */
  @Get()
  @ApiOperation({
    summary: 'Get all articles',
    description:
      'Returns all articles including drafts. This endpoint is restricted to administrators.',
  })
  @ApiResponse({
    status: 200,
    description: 'All articles returned successfully.',
  })
  async findAll() {
    return this.articlesService.findAllForAdmin();
  }

  /**
   * Returns a single article by its UUID for administrative access.
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get an article by ID',
    description:
      'Returns a single article by UUID. Draft articles are also accessible to administrators.',
  })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Article UUID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Article returned successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found.',
  })
  async findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  /**
   * Creates a new article.
   *
   * The authenticated user's ID should be passed to the service
   * by the authentication layer instead of accepting authorId from the client.
   */
  @Post()
  @ApiOperation({
    summary: 'Create an article',
    description:
      'Creates a new draft article. Only administrators can access this endpoint.',
  })
  @ApiResponse({
    status: 201,
    description: 'Article created successfully as a draft.',
  })
  async create(@Body() createArticleDto: CreateArticleDto) {
    /*
     * Temporary author ID.
     *
     * This value will be replaced with the authenticated admin ID
     * after CurrentUser decorator and authentication guards are wired
     * into the controller.
     */
    const authorId = 'authenticated-user-id';

    return this.articlesService.create(createArticleDto, authorId);
  }

  /**
   * Updates an existing article.
   *
   * PATCH allows the administrator to update only the fields
   * that were provided in the request body.
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update an article',
    description:
      'Updates article content and metadata. Publication state is handled by dedicated endpoints.',
  })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Article UUID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Article updated successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, updateArticleDto);
  }

  /**
   * Publishes an article.
   *
   * Publication rules are handled inside the service,
   * including setting publishedAt only during the first publication.
   */
  @Post(':id/publish')
  @ApiOperation({
    summary: 'Publish an article',
    description:
      'Publishes an article and sets publishedAt only if this is its first publication.',
  })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Article UUID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Article published successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found.',
  })
  async publish(@Param('id') id: string) {
    return this.articlesService.publish(id);
  }

  /**
   * Removes an article from public access.
   *
   * The original publishedAt value is intentionally preserved.
   */
  @Post(':id/unpublish')
  @ApiOperation({
    summary: 'Unpublish an article',
    description:
      'Hides the article from public users without removing its original publishedAt value.',
  })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Article UUID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Article unpublished successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found.',
  })
  async unpublish(@Param('id') id: string) {
    return this.articlesService.unpublish(id);
  }

  /**
   * Soft-deletes an article.
   *
   * The database record remains available for recovery or auditing.
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete an article',
    description:
      'Soft-deletes an article. Only administrators can access this endpoint.',
  })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Article UUID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Article deleted successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found.',
  })
  async remove(@Param('id') id: string) {
    await this.articlesService.remove(id);

    return {
      message: 'Article deleted successfully',
    };
  }
}
