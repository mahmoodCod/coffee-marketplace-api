/**
 * ------------------------------------------------------------------------
 * JWT Payload Interface
 * ------------------------------------------------------------------------
 *
 * Claims embedded inside access and refresh tokens.
 *
 * After JwtStrategy.validate(), the same shape is attached to request.user
 * and can be read with @CurrentUser().
 *
 * Field meanings:
 *   sub   -> User.id (UUID) — primary subject of the token
 *   phone -> User.phone used for OTP auth
 *   role  -> Role.name (e.g. "customer", "seller", "admin")
 * ------------------------------------------------------------------------
 */
export interface JwtPayload {
  /**
   * User UUID (JWT standard subject claim).
   */
  sub: string;

  /**
   * Authenticated mobile phone number.
   */
  phone: string;

  /**
   * Role name string (not role UUID).
   */
  role: string;
}
