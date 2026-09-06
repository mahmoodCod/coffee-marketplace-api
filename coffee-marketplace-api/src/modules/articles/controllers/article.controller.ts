import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
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
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';
import { Article } from '../entities/article.entity';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.ADMIN)
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
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.articlesService.findOne(id);
  }

  /**
   * Creates a new article as a draft.
   *
   * The authenticated user's ID is extracted from the verified JWT payload
   * through the CurrentUser decorator and passed to the service as the author ID.
   *
   * The author ID must come from the authenticated request rather than the
   * request body, because clients must not be able to create articles on behalf
   * of another user.
   */
  @Post()
  @ApiOperation({ summary: 'Create a new article' })
  @ApiResponse({
    status: 201,
    description: 'The article was successfully created.',
    type: Article,
  })
  async create(
    @Body() createArticleDto: CreateArticleDto,
    @CurrentUser('sub') authorId: string,
  ): Promise<Article> {
    // Pass the authenticated user's UUID to the service.
    // This replaces the previous placeholder value.
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
    @Param('id', new ParseUUIDPipe()) id: string,
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
  async publish(@Param('id', new ParseUUIDPipe()) id: string) {
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
  async unpublish(@Param('id', new ParseUUIDPipe()) id: string) {
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
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.articlesService.remove(id);

    return {
      message: 'Article deleted successfully',
    };
  }

  /**
   * Attaches an existing product to an existing article.
   *
   * UUID validation is performed at the HTTP boundary so invalid identifiers
   * are rejected before the request reaches the service or database layer.
   */
  @Post(':id/products/:productId')
  @ApiOperation({
    summary: 'Attach a product to an article',
    description:
      'Creates a relationship between an existing article and an existing product.',
  })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Article UUID.',
  })
  @ApiParam({
    name: 'productId',
    example: '660e8400-e29b-41d4-a716-446655440000',
    description: 'Product UUID.',
  })
  @ApiResponse({
    status: 201,
    description: 'Product attached to the article successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article or product not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'The product is already attached to the article.',
  })
  async attachProduct(
    @Param('id', new ParseUUIDPipe()) articleId: string,
    @Param('productId', new ParseUUIDPipe())
    productId: string,
  ): Promise<void> {
    // Delegate article existence, product existence, duplicate detection,
    // and relationship creation to the service layer.
    await this.articlesService.attachProduct(articleId, productId);
  }

  /**
   * Removes an existing product relationship from an article.
   *
   * Both identifiers must be valid UUIDs before the service attempts
   * to locate or delete the relationship.
   */
  @Delete(':id/products/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Detach a product from an article',
    description:
      'Removes the relationship between an article and a product without deleting either record.',
  })
  @ApiParam({
    name: 'id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Article UUID.',
  })
  @ApiParam({
    name: 'productId',
    example: '660e8400-e29b-41d4-a716-446655440000',
    description: 'Product UUID.',
  })
  @ApiResponse({
    status: 204,
    description: 'Product detached from the article successfully.',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found or product is not attached.',
  })
  async detachProduct(
    @Param('id', new ParseUUIDPipe()) articleId: string,
    @Param('productId', new ParseUUIDPipe())
    productId: string,
  ): Promise<void> {
    // Delegate relationship validation and deletion to the service layer.
    await this.articlesService.detachProduct(articleId, productId);
  }
}
