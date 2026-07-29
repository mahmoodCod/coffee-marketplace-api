import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { OtpPurpose } from '../enums/otp-purpose.enum';

/**
 * Shape of one stored OTP entry.
 * expiresAt is a unix timestamp in milliseconds.
 */
interface StoredOtp {
  code: string;
  purpose: OtpPurpose;
  expiresAt: number;
}

/**
 * ------------------------------------------------------------------------
 * OTP Service
 * ------------------------------------------------------------------------
 *
 * Handles OTP lifecycle only (no user / JWT logic).
 *
 * Config keys:
 *   otp.length     OTP_LENGTH      default 6
 *   otp.expiresIn  OTP_EXPIRES_IN  default 120 (seconds)
 *
 * Storage key format:
 *   `${purpose}:${phone}`
 *   example: "register:09123456789"
 *
 * Current storage:
 *   In-memory Map — fine for local development, lost on restart,
 *   and not shared across multiple server instances.
 *
 * TODO:
 *   Move save/verify to Redis with TTL = otp.expiresIn.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class OtpService {
  private readonly store = new Map<string, StoredOtp>();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generates a numeric OTP with configured digit length.
   * Example with length=6 -> values from 100000 to 999999.
   */
  generate(): string {
    const length = this.configService.getOrThrow<number>('otp.length');
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;

    return Math.floor(min + Math.random() * (max - min)).toString();
  }

  /**
   * OTP lifetime in seconds (from config).
   */
  getExpiration(): number {
    return this.configService.getOrThrow<number>('otp.expiresIn');
  }

  /**
   * Ensures OTP is digits-only and matches configured length.
   */
  validateFormat(otp: string): void {
    const length = this.configService.getOrThrow<number>('otp.length');

    if (!new RegExp(`^\\d{${length}}$`).test(otp)) {
      throw new BadRequestException('Invalid OTP format.');
    }
  }

  /**
   * Stores OTP for a phone + purpose.
   * Overwrites any previous OTP for the same key.
   */
  save(phone: string, code: string, purpose: OtpPurpose): void {
    const expiresInMs = this.getExpiration() * 1000;

    this.store.set(this.buildKey(phone, purpose), {
      code,
      purpose,
      expiresAt: Date.now() + expiresInMs,
    });
  }

  /**
   * Validates OTP then deletes it (one-time use).
   *
   * Failures:
   *   - missing / already used
   *   - expired
   *   - wrong code
   */
  verify(phone: string, code: string, purpose: OtpPurpose): void {
    this.validateFormat(code);

    const key = this.buildKey(phone, purpose);
    const stored = this.store.get(key);

    if (!stored) {
      throw new UnauthorizedException('OTP not found or already used.');
    }

    if (stored.expiresAt < Date.now()) {
      this.store.delete(key);
      throw new UnauthorizedException('OTP has expired.');
    }

    if (stored.code !== code) {
      throw new UnauthorizedException('Invalid OTP code.');
    }

    // Consume OTP so it cannot be reused.
    this.store.delete(key);
  }

  /**
   * Builds the Map/Redis key for a phone + purpose pair.
   */
  private buildKey(phone: string, purpose: OtpPurpose): string {
    return `${purpose}:${phone}`;
  }
}
