import { Conversation } from '../entities/conversation.entity';
import type { ConversationOwner } from '../models/conversation-owner.model';

/**
 * Defines the persistence contract for conversations.
 *
 * Infrastructure implementations must implement this interface.
 * The domain layer does not depend on any database technology.
 */
export interface ConversationRepository {
  /**
   * Persists a new conversation.
   */
  create(conversation: Conversation): Promise<void>;

  /**
   * Finds a conversation by its unique identifier.
   */
  findById(conversationId: string): Promise<Conversation | null>;

  /**
   * Updates an existing conversation.
   */
  save(conversation: Conversation): Promise<void>;

  /**
   * Atomically transfers conversation ownership.
   *
   * The operation succeeds only when the expected owner
   * still owns an active, non-expired conversation.
   */
  transferOwnership(
    conversation: Conversation,
    expectedOwner: ConversationOwner,
  ): Promise<void>;

  /**
   * Deletes a conversation and its associated persisted data.
   */
  delete(conversationId: string): Promise<void>;
}
