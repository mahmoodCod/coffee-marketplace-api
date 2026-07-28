import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

/**
 * ------------------------------------------------------------------------
 * Refresh Token DTO
 * ------------------------------------------------------------------------
 *
 * Receives a refresh token and issues a new access token.
 * ------------------------------------------------------------------------
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token',
  })
  @IsString()
  refreshToken: string;
}
