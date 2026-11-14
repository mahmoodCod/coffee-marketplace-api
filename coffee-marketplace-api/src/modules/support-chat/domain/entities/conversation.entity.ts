import { ConversationOwner } from '../models/conversation-owner.model';

/**
 * Represents the lifecycle status of a conversation.
 */
export type ConversationStatus = 'active' | 'closed';

/**
 * Defines the required data for creating a conversation.
 */
export interface CreateConversationInput {
  id: string;
  owner: ConversationOwner;
  expiresAt: Date;
  createdAt?: Date;
}

/**
 * Defines the complete persisted state required to restore a conversation.
 */
export interface RestoreConversationInput extends CreateConversationInput {
  status: ConversationStatus;
  updatedAt: Date;
}

/**
 * Conversation Aggregate Root.
 *
 * Responsible for maintaining conversation ownership,
 * lifecycle status, accessibility, and expiration rules.
 */
export class Conversation {
  readonly id: string;

  private _owner: ConversationOwner;
  private _status: ConversationStatus;

  readonly createdAt: Date;

  private _updatedAt: Date;
  private _expiresAt: Date;

  private constructor(input: RestoreConversationInput) {
    // Validate the conversation identifier.
    if (!input.id?.trim()) {
      throw new Error('Conversation ID is required.');
    }

    // Validate the conversation owner.
    if (!input.owner?.id?.trim()) {
      throw new Error('Conversation owner ID is required.');
    }

    if (!['guest', 'user'].includes(input.owner.type)) {
      throw new Error('Invalid conversation owner type.');
    }

    // Validate lifecycle status.
    if (!['active', 'closed'].includes(input.status)) {
      throw new Error('Invalid conversation status.');
    }

    // Validate timestamps.
    if (
      !(input.createdAt instanceof Date) ||
      Number.isNaN(input.createdAt.getTime())
    ) {
      throw new Error('A valid creation date is required.');
    }

    if (
      !(input.updatedAt instanceof Date) ||
      Number.isNaN(input.updatedAt.getTime())
    ) {
      throw new Error('A valid update date is required.');
    }

    if (
      !(input.expiresAt instanceof Date) ||
      Number.isNaN(input.expiresAt.getTime())
    ) {
      throw new Error('A valid expiration date is required.');
    }

    if (input.expiresAt.getTime() <= input.createdAt.getTime()) {
      throw new Error('Expiration date must be after creation date.');
    }

    if (input.updatedAt.getTime() < input.createdAt.getTime()) {
      throw new Error('Update date cannot be before creation date.');
    }

    this.id = input.id;
    this._owner = Object.freeze({ ...input.owner });
    this._status = input.status;

    // Store defensive copies to prevent external date mutations.
    this.createdAt = new Date(input.createdAt);
    this._updatedAt = new Date(input.updatedAt);
    this._expiresAt = new Date(input.expiresAt);
  }

  /**
   * Creates a new active conversation.
   */
  static create(input: CreateConversationInput): Conversation {
    const createdAt = input.createdAt ?? new Date();

    return new Conversation({
      ...input,
      status: 'active',
      createdAt,
      updatedAt: createdAt,
    });
  }

  /**
   * Restores a conversation from persisted data.
   *
   * This method preserves its lifecycle status and timestamps.
   */
  static restore(input: RestoreConversationInput): Conversation {
    return new Conversation(input);
  }

  /**
   * Returns a copy of the current conversation owner.
   */
  get owner(): ConversationOwner {
    return { ...this._owner };
  }

  /**
   * Returns the current conversation status.
   */
  get status(): ConversationStatus {
    return this._status;
  }

  /**
   * Returns the last update timestamp.
   */
  get updatedAt(): Date {
    return new Date(this._updatedAt);
  }

  /**
   * Returns the conversation expiration timestamp.
   */
  get expiresAt(): Date {
    return new Date(this._expiresAt);
  }

  /**
   * Checks whether the conversation has passed its expiration time.
   */
  get isExpired(): boolean {
    return Date.now() >= this._expiresAt.getTime();
  }

  /**
   * Checks whether the conversation can still be accessed.
   */
  get isAccessible(): boolean {
    return this._status === 'active' && !this.isExpired;
  }

  /**
   * Ensures that the conversation is active and not expired.
   */
  assertAccessible(requester: ConversationOwner): void {
    if (this._status === 'closed') {
      throw new Error('Conversation is closed.');
    }

    if (this.isExpired) {
      throw new Error('Conversation has expired.');
    }
  }

  /**
   * Extends the conversation expiration time.
   */
  refreshExpiration(ttlSeconds: number, now = new Date()): void {
    this.assertAccessible();

    if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error('TTL must be a positive safe integer.');
    }

    if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
      throw new Error('A valid current date is required.');
    }

    this._updatedAt = new Date(now);
    this._expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  }

  /**
   * Closes an active conversation permanently.
   */
  close(now = new Date()): void {
    this.assertAccessible();

    if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
      throw new Error('A valid current date is required.');
    }

    this._status = 'closed';
    this._updatedAt = new Date(now);
  }

  /**
   * Transfers conversation ownership.
   *
   * Explicit user consent must be verified by the application
   * layer before this domain operation is called.
   */
  transferOwnership(newOwner: ConversationOwner): void {
    this.assertAccessible();

    if (!newOwner?.id?.trim()) {
      throw new Error('New conversation owner ID is required.');
    }

    if (!['guest', 'user'].includes(newOwner.type)) {
      throw new Error('Invalid conversation owner type.');
    }

    if (newOwner.type === this._owner.type && newOwner.id === this._owner.id) {
      throw new Error('New owner must be different.');
    }

    this._owner = Object.freeze({ ...newOwner });
    this._updatedAt = new Date();
  }
}
