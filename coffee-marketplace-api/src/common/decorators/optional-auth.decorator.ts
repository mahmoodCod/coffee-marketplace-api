import { SetMetadata } from '@nestjs/common';

/**
 * ------------------------------------------------------------------------
 * Optional Authentication Decorator
 * ------------------------------------------------------------------------
 *
 * Allows an endpoint to be accessed by both guests and authenticated users.
 *
 * Behaviour:
 *
 * - Requests without an Authorization header are treated as guests.
 * - Requests with a valid access token are authenticated.
 * - Requests with an invalid or expired token are rejected.
 *
 * JwtAuthGuard handles the authentication behaviour.
 * ------------------------------------------------------------------------
 */

export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';

export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
import { SetMetadata } from '@nestjs/common';

/**
 * ------------------------------------------------------------------------
 * Optional Authentication Decorator
 * ------------------------------------------------------------------------
 *
 * Allows an endpoint to be accessed by both guests and authenticated users.
 *
 * Behaviour:
 *
 * - Requests without an Authorization header are treated as guests.
 * - Requests with a valid access token are authenticated.
 * - Requests with an invalid or expired token are rejected.
 *
 * JwtAuthGuard handles the authentication behaviour.
 * ------------------------------------------------------------------------
 */

export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';

export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
