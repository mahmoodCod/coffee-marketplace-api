import { PartialType } from '@nestjs/swagger';

import { CreateDiscountDto } from '../dto/create-discount.dto';

/**
 * ------------------------------------------------------------------------
 * Update Discount DTO
 * ------------------------------------------------------------------------
 *
 * All fields are optional when updating an existing discount.
 * ------------------------------------------------------------------------
 */
export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {}
