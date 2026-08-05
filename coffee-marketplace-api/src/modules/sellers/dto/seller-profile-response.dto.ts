import { ApiProperty } from '@nestjs/swagger';

/**
 * ------------------------------------------------------------------------
 * Seller Profile Response DTO
 * ------------------------------------------------------------------------
 *
 * Represents the authenticated seller profile.
 *
 * Returned by:
 *
 * GET /seller/profile
 * ------------------------------------------------------------------------
 */
export class SellerProfileResponseDto {
  /**
   * Seller UUID.
   */
  @ApiProperty()
  id: string;

  /**
   * Seller full name.
   */
  @ApiProperty({
    example: 'Mahmood Ahmadi',
    nullable: true,
  })
  name: string | null;

  /**
   * Seller phone number.
   */
  @ApiProperty({
    example: '989121234567',
  })
  phone: string;

  /**
   * Seller role.
   */
  @ApiProperty({
    example: 'seller',
  })
  role: string;

  /**
   * Account creation time.
   */
  @ApiProperty()
  createdAt: Date;

  /**
   * Last profile update.
   */
  @ApiProperty()
  updatedAt: Date;
}
