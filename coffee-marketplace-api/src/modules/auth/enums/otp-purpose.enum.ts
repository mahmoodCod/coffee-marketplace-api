/**
 * ------------------------------------------------------------------------
 * OTP Purpose
 * ------------------------------------------------------------------------
 *
 * Tells verify-otp whether the code was issued for:
 *   REGISTER -> create a new customer account after success
 *   LOGIN    -> authenticate an existing account after success
 *
 * The same phone can have separate OTPs for each purpose because
 * OtpService keys are `${purpose}:${phone}`.
 * ------------------------------------------------------------------------
 */
export enum OtpPurpose {
  REGISTER = 'register',
  LOGIN = 'login',
}
