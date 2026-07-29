import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMobilePhone, IsString } from 'class-validator';

import { OtpPurpose } from '../enums/otp-purpose.enum';

/**
 * ------------------------------------------------------------------------
 * Verify OTP DTO
 * ------------------------------------------------------------------------
 *
 * Body for POST /auth/verify-otp.
 *
 * Required fields:
 *   phone   — same phone used in register/login
 *   otp     — code currently stored for that phone+purpose
 *   purpose — "register" or "login" (must match how OTP was issued)
 *
 * Success response includes user + accessToken + refreshToken.
 * ------------------------------------------------------------------------
 */
export class VerifyOtpDto {
  @ApiProperty({
    example: '09123456789',
    description: 'User mobile phone number',
  })
  @IsMobilePhone('fa-IR')
  phone: string;

  @ApiProperty({
    example: '123456',
    description: 'OTP code received via SMS',
  })
  @IsString()
  otp: string;

  @ApiProperty({
    enum: OtpPurpose,
    example: OtpPurpose.REGISTER,
    description: 'Whether this OTP was issued for registration or login',
  })
  @IsEnum(OtpPurpose)
  purpose: OtpPurpose;
}
