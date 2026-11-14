import { createHash, randomBytes } from 'node:crypto';

import { GuestIdentity } from '../../../domain/entities/guest-identity.entity';
import { GuestIdentityRepository } from '../../../domain/repositories/guest-identity.repository';

/**
 * Defines the input required to create a guest identity.
 */
export interface CreateGuestIdentityCommand {
  /** Guest identity lifetime in seconds. */
  ttlSeconds: number;
}

/**
 * Contains the result of guest identity creation.
 */
export interface CreateGuestIdentityResult {
  /** Newly created guest identity. */
  guestIdentity: GuestIdentity;

  /**
   * Raw authentication token.
   *
   * This value must only be returned once and must never be persisted.
   */
  rawToken: string;
}

/**
 * Creates a new anonymous guest identity.
 *
 * A cryptographically secure token is generated for authentication.
 * Only its SHA-256 hash is persisted.
 */
export class CreateGuestIdentityUseCase {
  constructor(
    private readonly guestIdentityRepository: GuestIdentityRepository,
  ) {}

  /**
   * Executes the guest identity creation process.
   */
  async execute(
    command: CreateGuestIdentityCommand,
  ): Promise<CreateGuestIdentityResult> {
    // Validate the guest identity lifetime.
    if (!Number.isInteger(command.ttlSeconds) || command.ttlSeconds <= 0) {
      throw new Error('Guest identity TTL must be a positive integer.');
    }

    const now = new Date();

    // Generate a cryptographically secure random guest token.
    const rawToken = randomBytes(32).toString('base64url');

    // Hash the token before storing it.
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');

    // Calculate the guest identity expiration timestamp.
    const expiresAt = new Date(now.getTime() + command.ttlSeconds * 1000);

    // Create the guest identity through its domain factory.
    const guestIdentity = GuestIdentity.create({
      id: randomBytes(16).toString('hex'),
      tokenHash,
      createdAt: now,
      expiresAt,
    });

    // Persist only the hashed token.
    await this.guestIdentityRepository.create(guestIdentity);

    // Return the raw token only to the application layer.
    return {
      guestIdentity,
      rawToken,
    };
  }
}
