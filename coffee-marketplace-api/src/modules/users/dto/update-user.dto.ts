import { PartialType } from '@nestjs/swagger';

import { CreateUserDto } from './create-user.dto';

/**
 * ------------------------------------------------------------------------
 * Update User DTO
 * ------------------------------------------------------------------------
 *
 * Allows partial updates.
 * ------------------------------------------------------------------------
 */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
