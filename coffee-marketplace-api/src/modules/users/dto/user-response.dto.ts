import { ApiProperty } from '@nestjs/swagger';

import { UserStatus } from '../enums/user-status.enum';

/**
 * ------------------------------------------------------------------------
 * User Response DTO
 * ------------------------------------------------------------------------
 *
 * Standard response model for user resources.
 * ------------------------------------------------------------------------
 */
export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    example: '989121234567',
  })
  phone: string;

  @ApiProperty({
    enum: UserStatus,
  })
  status: UserStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
