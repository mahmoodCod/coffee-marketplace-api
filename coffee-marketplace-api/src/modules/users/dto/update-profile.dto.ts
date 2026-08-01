import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Update Profile DTO
 * ------------------------------------------------------------------------
 *
 * Body for PATCH /users/profile.
 * Authenticated users may update their own display name.
 *
 * Phone / role / status changes are NOT allowed here:
 * - phone  -> Auth flows
 * - role   -> Admin
 * - status -> Admin
 * ------------------------------------------------------------------------
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'علی رضایی',
    description: 'Display name shown on the user profile',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
