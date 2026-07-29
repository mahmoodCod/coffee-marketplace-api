/**
 * ------------------------------------------------------------------------
 * JWT Payload Interface
 * ------------------------------------------------------------------------
 *
 * Claims embedded inside access and refresh tokens.
 *
 * After JwtStrategy.validate(), a subset of this shape is attached to
 * request.user and can be read with @CurrentUser().
 *
 * Field meanings:
 *   sub      -> User.id (UUID) — primary subject of the token
 *   phone    -> User.phone used for OTP auth
 *   role     -> Role.name (e.g. "customer", "seller", "admin")
 *   tokenUse -> Distinguishes access vs refresh so a refresh JWT cannot
 *               be used as a Bearer access token (even if secrets match)
 * ------------------------------------------------------------------------
 */
export type JwtTokenUse = 'access' | 'refresh';

export interface JwtPayload {
  /**
   * User UUID (JWT standard subject claim).
   */
  sub: string;

  /**
   * Authenticated mobile phone number (canonical E.164 without +).
   */
  phone: string;

  /**
   * Role name string (not role UUID).
   */
  role: string;

  /**
   * Token kind. Required on signed JWTs.
   */
  tokenUse: JwtTokenUse;
}
