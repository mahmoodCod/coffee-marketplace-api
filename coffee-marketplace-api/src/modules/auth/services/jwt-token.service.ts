import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

import { JwtPayload } from '.././interfaces/jwt-payload.interface';
import { StringValue } from 'ms';

/**
 * ------------------------------------------------------------------------
 * JWT Token Service
 * ------------------------------------------------------------------------
 *
 * Responsible for:
 *
 * - Access Token
 * - Refresh Token
 * - Verify Access Token
 * - Verify Refresh Token
 *
 * AuthService should never directly use JwtService.
 * ------------------------------------------------------------------------
 */

@Injectable()
export class JwtTokenService {
  constructor(
    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate Access Token
   */
  async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.secret'),

      expiresIn: this.configService.getOrThrow<StringValue>('jwt.expiresIn'),
    });
  }

  /**
   * Generate Refresh Token
   */
  async generateRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),

      expiresIn: this.configService.getOrThrow<StringValue>(
        'jwt.refreshExpiresIn',
      ),
    });
  }

  /**
   * Verify Access Token
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.getOrThrow<string>('jwt.secret'),
    });
  }

  /**
   * Verify Refresh Token
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
    });
  }

  /**
   * Decode Token
   *
   * بدون اعتبارسنجی
   */
  decode(token: string): JwtPayload {
    return this.jwtService.decode(token) as JwtPayload;
  }
}
