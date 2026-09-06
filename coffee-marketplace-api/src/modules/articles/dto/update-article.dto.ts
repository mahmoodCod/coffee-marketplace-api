import { PartialType } from '@nestjs/swagger';

import { CreateArticleDto } from './create-article.dto';

/**
 * ------------------------------------------------------------------------
 * Update Article DTO
 * ------------------------------------------------------------------------
 *
 * All fields are optional because PATCH requests
 * may update only a subset of article data.
 * ------------------------------------------------------------------------
 */
export class UpdateArticleDto extends PartialType(CreateArticleDto) {}
