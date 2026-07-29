import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserStatus } from '../enums/user-status.enum';

/**
 * ------------------------------------------------------------------------
 * User Response DTO
 * ------------------------------------------------------------------------
 *
 * Safe public shape returned by profile endpoints.
 * ------------------------------------------------------------------------
 */
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({
    example: 'علی رضایی',
    nullable: true,
  })
  name: string | null;

  @ApiProperty({
    example: '989123456789',
  })
  phone: string;

  @ApiProperty({
    enum: UserStatus,
  })
  status: UserStatus;

  @ApiProperty({
    example: 'customer',
    description: 'Role name',
  })
  role: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
