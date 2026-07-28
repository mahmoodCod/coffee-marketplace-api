/**
 * ------------------------------------------------------------------------
 * JWT Payload Interface
 * ------------------------------------------------------------------------
 *
 * Payload stored inside JWT tokens.
 * ------------------------------------------------------------------------
 */

export interface JwtPayload {
  /**
   * User UUID
   */
  sub: string;

  /**
   * User phone number
   */
  phone: string;

  /**
   * User role
   */
  role: string;
}
