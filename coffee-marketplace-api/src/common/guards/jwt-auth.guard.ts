import { Injectable } from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';

/**
 * JWT authentication guard.
 *
 * This guard protects routes that require
 * an authenticated user.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
