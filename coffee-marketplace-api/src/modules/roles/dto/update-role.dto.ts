import { PartialType } from '@nestjs/mapped-types';

import { CreateRoleDto } from './create-role.dto';

/**
 * ------------------------------------------------------------------------
 * Update Role DTO
 * ------------------------------------------------------------------------
 *
 * All properties become optional.
 * ------------------------------------------------------------------------
 */
export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
