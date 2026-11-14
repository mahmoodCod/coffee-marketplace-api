import { Conversation } from '../entities/conversation.entity';

/**
 * Defines the persistence contract for conversations.
 *
 * Infrastructure implementations (such as Redis repositories)
 * must implement this interface.
 *
 * The domain layer does not depend on any database technology.
 */
export interface ConversationRepository {
  /**
   * Persists a new conversation.
   *
   * @param conversation - Conversation aggregate to persist.
   */
  create(conversation: Conversation): Promise<void>;

  /**
   * Finds a conversation by its unique identifier.
   *
   * Returns null when the conversation does not exist.
   *
   * @param conversationId - Unique conversation identifier.
   */
  findById(conversationId: string): Promise<Conversation | null>;

  /**
   * Updates an existing conversation.
   *
   * The implementation must preserve conversation ownership
   * and lifecycle information.
   *
   * @param conversation - Updated conversation aggregate.
   */
  save(conversation: Conversation): Promise<void>;

  /**
   * Deletes a conversation and its associated persisted data.
   *
   * The implementation is responsible for cleaning up
   * related messages, state, and product references.
   *
   * @param conversationId - Unique conversation identifier.
   */
  delete(conversationId: string): Promise<void>;
}
