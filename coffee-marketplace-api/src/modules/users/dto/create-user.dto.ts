import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsMobilePhone,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMobilePhone, IsNotEmpty, IsPhoneNumber, IsUUID } from 'class-validator';
import { IsEnum, IsMobilePhone, IsNotEmpty, IsUUID } from 'class-validator';

import { UserStatus } from '../enums/user-status.enum';

/**
 * ------------------------------------------------------------------------
 * Create User DTO
 * ------------------------------------------------------------------------
 *
 * Internal / admin-oriented payload for creating a user record.
 * Public registration is handled by the Auth module (OTP flow).
 * ------------------------------------------------------------------------
 */
export class CreateUserDto {
  @ApiProperty({
    example: '09123456789',
    description: 'User mobile phone number (fa-IR)',
  })
  @IsMobilePhone('fa-IR')
  phone: string;

  @ApiPropertyOptional({
    example: UserStatus.ACTIVE,
    enum: UserStatus,
  })
  @IsOptional()
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
