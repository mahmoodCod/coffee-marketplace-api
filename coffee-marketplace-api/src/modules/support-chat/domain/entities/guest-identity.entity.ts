/**
 * Defines the required data for creating a guest identity.
 */
export interface CreateGuestIdentityInput {
  /** Internal identifier of the guest identity. */
  id: string;

  /**
   * Hash of the guest authentication token.
   *
   * The raw token must never be stored in the database.
   */
  tokenHash: string;

  /** Guest identity expiration timestamp. */
  expiresAt: Date;

  /** Optional creation timestamp. */
  createdAt?: Date;
}

/**
 * Represents an anonymous visitor identity.
 *
 * A guest identity is independent of conversations
 * and can own multiple conversations.
 */
export class GuestIdentity {
  readonly id: string;
  readonly tokenHash: string;
  readonly createdAt: Date;

  private _expiresAt: Date;

  private constructor(input: CreateGuestIdentityInput) {
    // Validate the guest identity identifier.
    if (!input.id?.trim()) {
      throw new Error('Guest identity ID is required.');
    }

    // Validate the hashed authentication token.
    if (!input.tokenHash?.trim()) {
      throw new Error('Guest token hash is required.');
    }

    // Validate the expiration timestamp.
    if (
      !(input.expiresAt instanceof Date) ||
      Number.isNaN(input.expiresAt.getTime())
    ) {
      throw new Error('A valid expiration date is required.');
    }

    // Use the current time when creation date is not provided.
    const createdAt = input.createdAt ?? new Date();

    if (!(createdAt instanceof Date) || Number.isNaN(createdAt.getTime())) {
      throw new Error('A valid creation date is required.');
    }

    // Guest identity must expire after its creation.
    if (input.expiresAt.getTime() <= createdAt.getTime()) {
      throw new Error('Expiration date must be after creation date.');
    }

    this.id = input.id;
    this.tokenHash = input.tokenHash;
    this.createdAt = new Date(createdAt);
    this._expiresAt = new Date(input.expiresAt);
  }

  /**
   * Creates a new guest identity.
   */
  static create(input: CreateGuestIdentityInput): GuestIdentity {
    return new GuestIdentity(input);
  }

  /**
   * Returns the guest identity expiration timestamp.
   */
  get expiresAt(): Date {
    return new Date(this._expiresAt);
  }

  /**
   * Checks whether the guest identity has expired.
   */
  get isExpired(): boolean {
    return Date.now() >= this._expiresAt.getTime();
  }

  /**
   * Ensures that the guest identity is still valid.
   */
  assertActive(): void {
    if (this.isExpired) {
      throw new Error('Guest identity has expired.');
    }
  }

  /**
   * Extends the guest identity expiration time.
   */
  refreshExpiration(ttlSeconds: number, now = new Date()): void {
    this.assertActive();

    if (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error('TTL must be a positive integer.');
    }

    if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
      throw new Error('A valid current date is required.');
    }

    this._expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  }
}
