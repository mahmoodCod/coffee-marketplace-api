import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Login DTO
 * ------------------------------------------------------------------------
 *
 * Body for POST /auth/login.
 * Starts login by requesting an OTP for an existing phone number.
 * ------------------------------------------------------------------------
 */
export class LoginDto {
  @ApiProperty({
    example: '09123456789',
    description: 'User mobile phone number',
  })
  @IsMobilePhone('fa-IR')
  phone: string;
}
