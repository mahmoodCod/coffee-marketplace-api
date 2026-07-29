import { ApiProperty } from '@nestjs/swagger';
import { IsMobilePhone, IsString, Length } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Verify OTP DTO
 * ------------------------------------------------------------------------
 *
 * Verifies the OTP received by SMS.
 * ------------------------------------------------------------------------
 */
export class VerifyOtpDto {
  @ApiProperty({
    example: '09123456789',
  })
  @IsMobilePhone('fa-IR')
  phone: string;

  @ApiProperty({
    example: '123456',
  })
  @IsString()
  otp: string;
}
