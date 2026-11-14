import { createHash } from 'node:crypto';

import { GuestIdentityRepository } from '../../../domain/repositories/guest-identity.repository';

/**
 * Defines the input required to refresh a guest identity.
 */
export interface RefreshGuestIdentityCommand {
  /** Raw guest authentication token received from the client. */
  rawToken: string;

  /** New guest identity lifetime in seconds. */
  ttlSeconds: number;
}

/**
 * Refreshes the expiration time of an existing guest identity.
 *
 * Only a valid, non-expired guest identity can be refreshed.
 * The raw authentication token is never persisted.
 */
export class RefreshGuestIdentityUseCase {
  constructor(
    private readonly guestIdentityRepository: GuestIdentityRepository,
  ) {}

  /**
   * Executes the guest identity expiration refresh process.
   */
  async execute(command: RefreshGuestIdentityCommand): Promise<void> {
    // Validate the raw guest authentication token.
    if (
      typeof command.rawToken !== 'string' ||
      command.rawToken.length !== 43
    ) {
      throw new Error('Invalid guest authentication token.');
    }

    // Validate the requested guest identity lifetime.
    if (!Number.isInteger(command.ttlSeconds) || command.ttlSeconds <= 0) {
      throw new Error('Guest identity TTL must be a positive integer.');
    }

    // Hash the raw token before performing the repository lookup.
    const tokenHash = createHash('sha256')
      .update(command.rawToken)
      .digest('hex');

    // Retrieve the guest identity using its hashed token.
    const guestIdentity =
      await this.guestIdentityRepository.findByTokenHash(tokenHash);

    if (!guestIdentity) {
      throw new Error('Guest identity not found.');
    }

    // Extend the expiration through the domain entity.
    guestIdentity.refreshExpiration(command.ttlSeconds);

    // Persist the updated guest identity.
    await this.guestIdentityRepository.save(guestIdentity);
  }
}
