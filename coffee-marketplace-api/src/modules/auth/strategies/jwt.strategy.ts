import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersRepository } from '../../users/repositories/users.repository';
import { UserStatus } from '../../users/enums/user-status.enum';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * ------------------------------------------------------------------------
 * JWT Strategy (Passport)
 * ------------------------------------------------------------------------
 *
 * Used by JwtAuthGuard on protected routes.
 *
 * Runtime flow for a protected request:
 *
 *   Authorization: Bearer <accessToken>
 *           |
 *           v
 *   JwtAuthGuard  -> Passport "jwt" strategy (this class)
 *           |
 *           +--> verify signature with jwt.accessSecret
 *           +--> reject if expired (ignoreExpiration=false)
 *           +--> validate(payload):
 *                  reject if tokenUse !== access
 *                  load user by payload.sub
 *                  reject if user missing or not ACTIVE
 *                  return JwtPayload -> attached as request.user
 *           |
 *           v
 *   Controller can read user via @CurrentUser()
 * ------------------------------------------------------------------------
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersRepository: UsersRepository,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.accessSecret'),
    });
  }

  /**
   * Called after Passport successfully verifies the JWT.
   * Whatever we return becomes `request.user`.
   */
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    if (payload.tokenUse !== 'access') {
      throw new UnauthorizedException('Invalid access token.');
    }

    const user = await this.usersRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User account is not active.');
    }

    return {
      sub: user.id,
      phone: user.phone,
      role: user.role.name,
      tokenUse: 'access',
    };
  }
}
