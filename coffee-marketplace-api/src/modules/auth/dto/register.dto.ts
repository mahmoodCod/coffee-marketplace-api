import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Register DTO
 * ------------------------------------------------------------------------
 *
 * Body for POST /auth/register.
 * Starts registration by requesting an OTP for a new phone number.
 *
 * Phone format: Iranian mobile validated by class-validator fa-IR
 * (example: 09123456789).
 * ------------------------------------------------------------------------
 */
export class RegisterDto {
  @ApiProperty({
    example: '09123456789',
    description: 'User mobile phone number',
  })
  @IsMobilePhone('fa-IR')
  phone: string;
}
