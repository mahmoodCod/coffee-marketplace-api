import { createHash, randomBytes } from 'node:crypto';

import { GuestIdentity } from '../../../domain/entities/guest-identity.entity';
import { GuestIdentityRepository } from '../../../domain/repositories/guest-identity.repository';

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
 * Handles guest identity creation, retrieval, and expiration.
 */
export class GuestIdentityUseCase {
  constructor(
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
      id: randomBytes(16).toString('hex'),
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
