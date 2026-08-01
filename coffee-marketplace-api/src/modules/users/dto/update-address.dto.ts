import { PartialType } from '@nestjs/swagger';

import { CreateAddressDto } from './create-address.dto';

/**
 * ------------------------------------------------------------------------
 * Update Address DTO
 * ------------------------------------------------------------------------
 *
 * Body for PATCH /users/addresses/:id.
 * ------------------------------------------------------------------------
 */
export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
