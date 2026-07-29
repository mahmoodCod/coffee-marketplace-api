import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Refresh Token DTO
 * ------------------------------------------------------------------------
 *
 * Receives a refresh token and generates a new access token.
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
