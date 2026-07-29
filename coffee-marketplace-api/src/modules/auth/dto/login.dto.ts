import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Login DTO
 * ------------------------------------------------------------------------
 *
 * Requests an OTP for user authentication.
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
