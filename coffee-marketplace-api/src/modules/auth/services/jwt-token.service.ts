import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';

import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * ------------------------------------------------------------------------
 * JWT Token Service
 * ------------------------------------------------------------------------
 *
 * Single place for all JWT create / verify / revoke operations.
 *
 * Config keys (from src/config/configuration.ts):
 *   jwt.accessSecret      JWT_ACCESS_SECRET
 *   jwt.accessExpiresIn   JWT_ACCESS_EXPIRES_IN   (e.g. "15m")
 *   jwt.refreshSecret     JWT_REFRESH_SECRET
 *   jwt.refreshExpiresIn  JWT_REFRESH_EXPIRES_IN  (e.g. "30d")
 *
 * Why this service exists:
 *   AuthService must not call Nest JwtService directly.
 *   Keeping secrets + expiry here avoids duplicated JWT logic.
 *
 * Refresh token tracking:
 *   Newly issued refresh tokens are stored in an in-memory Set.
 *   verifyRefreshToken rejects tokens that are not in that Set
 *   (covers logout / unknown tokens).
 *
 * TODO before production:
 *   Replace in-memory Set with Redis (or DB) so tokens survive restarts
 *   and work across multiple app instances.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class JwtTokenService {
  /**
   * Temporary refresh-token allow-list.
   * Key = raw refresh JWT string.
   */
  private readonly refreshTokens = new Set<string>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Creates a short-lived access token used on protected endpoints.
   */
  async generateAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.configService.getOrThrow<StringValue>(
        'jwt.accessExpiresIn',
      ),
    });
  }

  /**
   * Creates a long-lived refresh token and tracks it for later revoke/verify.
   */
  async generateRefreshToken(payload: JwtPayload): Promise<string> {
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.configService.getOrThrow<StringValue>(
        'jwt.refreshExpiresIn',
      ),
    });

    this.refreshTokens.add(token);

    return token;
  }

  /**
   * Verifies access token signature + expiry.
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  /**
   * Verifies refresh token is:
   *   1) still tracked (not logged out / unknown)
   *   2) cryptographically valid and not expired
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    if (!this.refreshTokens.has(token)) {
      throw new UnauthorizedException('Refresh token is not recognized.');
    }

    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      this.refreshTokens.delete(token);
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  /**
   * Removes refresh token from the allow-list (logout).
   */
  revokeRefreshToken(token: string): void {
    this.refreshTokens.delete(token);
  }

  /**
   * Decodes a JWT without verifying signature/expiry.
   * Prefer verify* methods for security-sensitive paths.
   */
  decode(token: string): JwtPayload | null {
    return this.jwtService.decode(token) as JwtPayload | null;
  }
}
