import { ConversationState } from '../models/conversation-state.model';

/**
 * Defines the persistence contract for conversation states.
 *
 * Infrastructure implementations are responsible for storing
 * and retrieving conversation state without exposing database
 * implementation details to the domain layer.
 */
export interface ConversationStateRepository {
  /**
   * Persists a conversation state.
   *
   * If a state already exists for the conversation,
   * the implementation must update the existing state.
   *
   * @param state - Conversation state to persist.
   */
  save(state: ConversationState): Promise<void>;

  /**
   * Retrieves the current state of a conversation.
   *
   * Returns null when no state exists.
   *
   * @param conversationId - Unique conversation identifier.
   */
  findByConversationId(
    conversationId: string,
  ): Promise<ConversationState | null>;

  /**
   * Deletes the state associated with a conversation.
   *
   * @param conversationId - Unique conversation identifier.
   */
  delete(conversationId: string): Promise<void>;
}
