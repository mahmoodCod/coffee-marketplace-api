import { createHash } from 'node:crypto';

import { GuestIdentity } from '../../../domain/entities/guest-identity.entity';
import { GuestIdentityRepository } from '../../../domain/repositories/guest-identity.repository';

/**
 * Defines the input required to retrieve a guest identity.
 */
export interface GetGuestIdentityQuery {
  /** Raw guest authentication token received from the client. */
  rawToken: string;
}

/**
 * Retrieves and validates a guest identity using its authentication token.
 *
 * Raw tokens are never used for repository lookups.
 * Only their SHA-256 hashes are used for identity verification.
 */
export class GetGuestIdentityUseCase {
  constructor(
    private readonly guestIdentityRepository: GuestIdentityRepository,
  ) {}

  /**
   * Executes the guest identity retrieval process.
   */
  async execute(query: GetGuestIdentityQuery): Promise<GuestIdentity> {
    // Validate the supplied authentication token.
    if (typeof query.rawToken !== 'string' || query.rawToken.length !== 43) {
      throw new Error('Invalid guest authentication token.');
    }

    // Hash the raw token before performing the repository lookup.
    const tokenHash = createHash('sha256').update(query.rawToken).digest('hex');

    // Retrieve the guest identity using its hashed token.
    const guestIdentity =
      await this.guestIdentityRepository.findByTokenHash(tokenHash);

    if (!guestIdentity) {
      throw new Error('Guest identity not found.');
    }

    // Reject expired guest identities.
    guestIdentity.assertActive();

    return guestIdentity;
  }
}
