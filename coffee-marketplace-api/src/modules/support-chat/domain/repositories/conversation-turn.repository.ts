import { ConversationTurn } from '../models/conversation-message.model';

/**
 * Defines the persistence contract for conversation turns.
 *
 * A conversation turn contains all messages generated during
 * one customer request, including assistant tool calls and results.
 */
export interface ConversationTurnRepository {
  /**
   * Atomically appends a complete turn to a conversation.
   *
   * The implementation must:
   * - Preserve turn ordering.
   * - Prevent duplicate request IDs.
   * - Keep all messages belonging to the turn together.
   *
   * @returns True when the turn was stored, false when
   * the request ID was already processed.
   */
  append(conversationId: string, turn: ConversationTurn): Promise<boolean>;

  /**
   * Retrieves recent conversation turns in chronological order.
   *
   * @param conversationId - Conversation identifier.
   * @param limit - Maximum number of turns to retrieve.
   */
  findRecent(
    conversationId: string,
    limit: number,
  ): Promise<ConversationTurn[]>;

  /**
   * Finds a previously stored turn using its request ID.
   *
   * This supports request idempotency and duplicate detection.
   */
  findByRequestId(
    conversationId: string,
    requestId: string,
  ): Promise<ConversationTurn | null>;

  /**
   * Deletes all stored turns belonging to a conversation.
   */
  deleteAll(conversationId: string): Promise<void>;
}
