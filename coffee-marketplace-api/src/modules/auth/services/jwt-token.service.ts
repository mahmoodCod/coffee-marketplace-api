import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';

import { JwtPayload } from '../interfaces/jwt-payload.interface';

type TokenClaims = Omit<JwtPayload, 'tokenUse'>;

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
 * Security:
 *   Every token embeds tokenUse = "access" | "refresh".
 *   verifyAccessToken / JwtStrategy reject refresh tokens.
 *   Prefer DIFFERENT values for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.
 *
 * Refresh token tracking:
 *   Newly issued refresh tokens are stored in an in-memory Set.
 *   verifyRefreshToken rejects tokens that are not in that Set.
 *
 * TODO before production:
 *   Replace in-memory Set with Redis so tokens survive restarts.
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
  async generateAccessToken(payload: TokenClaims): Promise<string> {
    const claims: JwtPayload = {
      ...payload,
      tokenUse: 'access',
    };

    return this.jwtService.signAsync(claims, {
      secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: this.configService.getOrThrow<StringValue>(
        'jwt.accessExpiresIn',
      ),
    });
  }

  /**
   * Creates a long-lived refresh token and tracks it for later revoke/verify.
   */
  async generateRefreshToken(payload: TokenClaims): Promise<string> {
    const claims: JwtPayload = {
      ...payload,
      tokenUse: 'refresh',
    };

    const token = await this.jwtService.signAsync(claims, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.configService.getOrThrow<StringValue>(
        'jwt.refreshExpiresIn',
      ),
    });

    this.refreshTokens.add(token);

    return token;
  }

  /**
   * Verifies access token signature, expiry, and tokenUse === access.
   */
  async verifyAccessToken(token: string): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      });

      this.assertTokenUse(payload, 'access');

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }

  /**
   * Verifies refresh token is:
   *   1) still tracked (not logged out / unknown)
   *   2) cryptographically valid and not expired
   *   3) tokenUse === refresh
   */
  async verifyRefreshToken(token: string): Promise<JwtPayload> {
    if (!this.refreshTokens.has(token)) {
      throw new UnauthorizedException('Refresh token is not recognized.');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });

      this.assertTokenUse(payload, 'refresh');

      return payload;
    } catch (error) {
      this.refreshTokens.delete(token);

      if (error instanceof UnauthorizedException) {
        throw error;
      }

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

  private assertTokenUse(
    payload: JwtPayload,
    expected: JwtPayload['tokenUse'],
  ): void {
    if (payload.tokenUse !== expected) {
      throw new UnauthorizedException(
        `Invalid token type. Expected ${expected} token.`,
      );
    }
  }
}
