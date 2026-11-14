import { GuestIdentity } from '../entities/guest-identity.entity';

/**
 * Defines the persistence contract for guest identities.
 *
 * Infrastructure implementations must implement this interface.
 * The domain layer remains independent of Redis and PostgreSQL.
 */
export interface GuestIdentityRepository {
  /**
   * Persists a new guest identity.
   *
   * @param guestIdentity - Guest identity to persist.
   */
  create(guestIdentity: GuestIdentity): Promise<void>;

  /**
   * Finds a guest identity using its internal identifier.
   *
   * Returns null when the identity does not exist.
   *
   * @param guestIdentityId - Internal guest identity identifier.
   */
  findById(guestIdentityId: string): Promise<GuestIdentity | null>;

  /**
   * Finds a guest identity using its hashed authentication token.
   *
   * Raw guest tokens must never be used for database lookups.
   *
   * @param tokenHash - Hashed guest authentication token.
   */
  findByTokenHash(tokenHash: string): Promise<GuestIdentity | null>;

  /**
   * Updates an existing guest identity.
   *
   * @param guestIdentity - Updated guest identity.
   */
  save(guestIdentity: GuestIdentity): Promise<void>;

  /**
   * Deletes a guest identity.
   *
   * The implementation must also handle its associated
   * conversations according to the application's retention policy.
   *
   * @param guestIdentityId - Internal guest identity identifier.
   */
  delete(guestIdentityId: string): Promise<void>;
}
