import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';

import { GuestIdentity } from '../../entities/guest-identity.entity';

import type { GuestIdentityRepository } from '../../repositories/guest-identity.repository';

import { SUPPORT_CHAT_TOKENS } from '../../../constants/support-chat.tokens';

/**
 * Contains the result of guest identity creation.
 *
 * The raw token is returned only once and must never be persisted.
 */
export interface CreateGuestIdentityResult {
  guestIdentity: GuestIdentity;
  rawToken: string;
}

/**
 * ------------------------------------------------------------------------
 * Guest Identity Use Case
 * ------------------------------------------------------------------------
 *
 * Handles guest identity creation, retrieval, and expiration.
 *
 * Security:
 * - Generates cryptographically secure access tokens.
 * - Stores only SHA-256 token hashes.
 * - Never persists or logs raw guest tokens.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class GuestIdentityUseCase {
  constructor(
    @Inject(SUPPORT_CHAT_TOKENS.GUEST_IDENTITY_REPOSITORY)
    private readonly guestIdentityRepository: GuestIdentityRepository,
  ) {}

  /**
   * Creates a guest identity and generates a secure access token.
   */
  async create(ttlSeconds: number): Promise<CreateGuestIdentityResult> {
    this.validateTtl(ttlSeconds);

    // Generate a cryptographically secure guest access token.
    const rawToken = randomBytes(32).toString('base64url');

    // Store only the token hash instead of the raw token.
    const tokenHash = this.hashToken(rawToken);

    const now = new Date();

    const guestIdentity = GuestIdentity.create({
      // Generate a UUID compatible with the PostgreSQL UUID column.
      id: randomUUID(),
      tokenHash,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
    });

    await this.guestIdentityRepository.create(guestIdentity);

    return {
      guestIdentity,
      rawToken,
    };
  }

  /**
   * Retrieves an active guest identity using its raw access token.
   */
  async getByToken(rawToken: string): Promise<GuestIdentity> {
    this.validateRawToken(rawToken);

    // Hash the token before querying the repository.
    const tokenHash = this.hashToken(rawToken);

    const guestIdentity =
      await this.guestIdentityRepository.findByTokenHash(tokenHash);

    if (!guestIdentity) {
      throw new Error('Guest identity not found.');
    }

    guestIdentity.assertActive();

    return guestIdentity;
  }

  /**
   * Resolves an existing guest identity or creates a new one.
   *
   * A new identity is created only when no guest token is provided.
   */
  async resolve(
    rawToken: string | undefined,
    ttlSeconds: number,
  ): Promise<CreateGuestIdentityResult> {
    this.validateTtl(ttlSeconds);

    if (rawToken === undefined || rawToken.length === 0) {
      return this.create(ttlSeconds);
    }

    const guestIdentity = await this.getByToken(rawToken);

    return {
      guestIdentity,
      rawToken,
    };
  }

  /**
   * Extends the expiration time of an existing guest identity.
   */
  async refresh(rawToken: string, ttlSeconds: number): Promise<GuestIdentity> {
    this.validateRawToken(rawToken);
    this.validateTtl(ttlSeconds);

    const tokenHash = this.hashToken(rawToken);

    const guestIdentity =
      await this.guestIdentityRepository.findByTokenHash(tokenHash);

    if (!guestIdentity) {
      throw new Error('Guest identity not found.');
    }

    // Ensure expired guest identities cannot be refreshed.
    guestIdentity.assertActive();

    guestIdentity.refreshExpiration(ttlSeconds);

    await this.guestIdentityRepository.save(guestIdentity);

    return guestIdentity;
  }

  /**
   * Calculates the SHA-256 hash of a guest access token.
   */
  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Validates the format of a generated guest access token.
   */
  private validateRawToken(rawToken: string): void {
    if (typeof rawToken !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(rawToken)) {
      throw new Error('A valid guest access token is required.');
    }
  }

  /**
   * Validates a positive guest identity lifetime.
   */
  private validateTtl(ttlSeconds: number): void {
    if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error('TTL must be a positive safe integer.');
    }
  }
}
