import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Create Role DTO
 * ------------------------------------------------------------------------
 *
 * Defines the payload required to create a new system role.
 *
 * Validation rules are executed automatically by NestJS ValidationPipe.
 * ------------------------------------------------------------------------
 */
export class CreateRoleDto {
  /**
   * Unique role name.
   *
   * Examples:
   * - admin
   * - seller
   * - customer
   */
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  /**
   * Optional role description.
   */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
