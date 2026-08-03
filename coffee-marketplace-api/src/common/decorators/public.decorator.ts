import { SetMetadata } from '@nestjs/common';

/**
 * ------------------------------------------------------------------------
 * Public Decorator
 * ------------------------------------------------------------------------
 *
 * Marks an endpoint as publicly accessible.
 *
 * JwtAuthGuard will ignore these endpoints.
 *
 * Example:
 *
 * @Public()
 * POST /auth/login
 * ------------------------------------------------------------------------
 */

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
