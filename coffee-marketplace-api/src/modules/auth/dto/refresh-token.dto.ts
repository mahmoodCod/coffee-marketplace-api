import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Refresh Token DTO
 * ------------------------------------------------------------------------
 *
 * Body for:
 *   POST /auth/refresh  -> issue a new access token
 *   POST /auth/logout   -> revoke this refresh token
 *
 * Client must send the refreshToken previously returned by verify-otp.
 * ------------------------------------------------------------------------
 */
export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIs...',
    description: 'JWT refresh token',
  })
  @IsString()
  refreshToken: string;
}
