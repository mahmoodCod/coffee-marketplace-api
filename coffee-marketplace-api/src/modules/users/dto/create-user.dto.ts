import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMobilePhone, IsNotEmpty, IsPhoneNumber, IsUUID } from 'class-validator';
import { IsEnum, IsMobilePhone, IsNotEmpty, IsUUID } from 'class-validator';

import { UserStatus } from '../enums/user-status.enum';

/**
 * ------------------------------------------------------------------------
 * Create User DTO
 * ------------------------------------------------------------------------
 *
 * Used for creating a new user.
 *
 * Notes:
 * Phone numbers must follow the E.164 standard.
 * ------------------------------------------------------------------------
 */
export class CreateUserDto {
  @ApiProperty({
    example: '989121234567',
    description: 'User phone number (E.164 format)',
  })
  @IsMobilePhone('fa-IR')
  phone: string;

  @ApiProperty({
    example: UserStatus.ACTIVE,
    enum: UserStatus,
  })
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({
    example: '9f9dbf3c-3db0-44ff-b4f4-5f7f48b84791',
    description: 'Role UUID',
  })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;
}
