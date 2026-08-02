import { PartialType } from '@nestjs/swagger';

import { CreateCategoryDto } from './create-category.dto';

/**
 * ------------------------------------------------------------------------
 * Update Category DTO
 * ------------------------------------------------------------------------
 *
 * Allows partial updates.
 * ------------------------------------------------------------------------
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
