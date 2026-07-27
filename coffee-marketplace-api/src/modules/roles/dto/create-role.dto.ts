import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({
    example: 'seller',
    description: 'Unique name of the system role.',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  /**
   * Optional role description.
   */
  @ApiPropertyOptional({
    example: 'Coffee shop owner with product management permissions.',
    description: 'Short description of the role.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
