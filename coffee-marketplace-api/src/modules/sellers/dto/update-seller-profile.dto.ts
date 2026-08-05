import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Update Seller Profile DTO
 * ------------------------------------------------------------------------
 *
 * Allows the authenticated seller
 * to update profile information.
 *
 * Currently editable:
 * - name
 *
 * Future:
 * - avatar
 * - store name
 * - description
 * ------------------------------------------------------------------------
 */
export class UpdateSellerProfileDto {
  /**
   * Seller full name.
   */
  @ApiPropertyOptional({
    example: 'Mahmood Ahmadi',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
