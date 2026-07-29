import { BadRequestException, Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

/**
 * ------------------------------------------------------------------------
 * OTP Service
 * ------------------------------------------------------------------------
 *
 * Responsible for:
 *
 * - Generating OTP codes
 * - Validating OTP format
 * - Managing OTP expiration
 *
 * Notes:
 *
 * OTP persistence will be implemented using Redis.
 *
 * This service currently generates OTP codes only.
 *
 * ------------------------------------------------------------------------
 */

@Injectable()
export class OtpService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * ----------------------------------------------------------------------
   * Generate OTP
   * ----------------------------------------------------------------------
   *
   * Generates a numeric OTP based on configured length.
   *
   * Returns:
   *
   * string
   *
   * ----------------------------------------------------------------------
   */
  generate(): string {
    const length = this.configService.getOrThrow<number>('otp.length');

    const min = Math.pow(10, length - 1);

    const max = Math.pow(10, length) - 1;

    return Math.floor(min + Math.random() * (max - min)).toString();
  }

  /**
   * ----------------------------------------------------------------------
   * Validate OTP Format
   * ----------------------------------------------------------------------
   *
   * Throws:
   *
   * BadRequestException
   *
   * ----------------------------------------------------------------------
   */
  validateFormat(otp: string): void {
    const length = this.configService.getOrThrow<number>('otp.length');

    if (!new RegExp(`^\\d{${length}}$`).test(otp)) {
      throw new BadRequestException('Invalid OTP format.');
    }
  }

  /**
   * ----------------------------------------------------------------------
   * OTP Expiration Time
   * ----------------------------------------------------------------------
   *
   * Returns expiration time in seconds.
   *
   * ----------------------------------------------------------------------
   */
  getExpiration(): number {
    return this.configService.getOrThrow<number>('otp.expiresIn');
  }
}
