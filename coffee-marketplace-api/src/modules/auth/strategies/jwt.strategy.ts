import { Injectable } from '@nestjs/common';

import { PassportStrategy } from '@nestjs/passport';

import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from '../../users/services/user.service';

import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      // Extract JWT token from Authorization Bearer header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Reject expired tokens automatically
      ignoreExpiration: false,

      // Secret key used to verify JWT signature
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  /**
   * Validate JWT payload after token verification.
   *
   * The returned user object will be attached
   * to request.user.
   */
  async validate(payload: JwtPayload) {
    // Find user by ID stored in JWT subject
    const user = await this.usersService.findById(payload.sub);

    return user;
  }
}
