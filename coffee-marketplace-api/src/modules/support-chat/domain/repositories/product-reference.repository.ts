import { ConversationProductReference } from '../models/product-reference.model';

/**
 * Defines the persistence contract for conversation product references.
 *
 * Product references are scoped to individual conversations.
 * The AI model must never receive actual database product IDs.
 */
export interface ProductReferenceRepository {
  /**
   * Persists a product reference.
   *
   * @param productReference - Product reference to persist.
   */
  save(productReference: ConversationProductReference): Promise<void>;

  /**
   * Finds a product reference within a specific conversation.
   *
   * The implementation must verify both the conversation ID
   * and the reference to prevent cross-conversation access.
   *
   * @param conversationId - Owner conversation identifier.
   * @param reference - Opaque product reference.
   */
  findByReference(
    conversationId: string,
    reference: string,
  ): Promise<ConversationProductReference | null>;

  /**
   * Retrieves all product references associated with a conversation.
   *
   * @param conversationId - Conversation identifier.
   */
  findAllByConversationId(
    conversationId: string,
  ): Promise<ConversationProductReference[]>;

  /**
   * Deletes a specific product reference.
   *
   * @param conversationId - Owner conversation identifier.
   * @param reference - Opaque product reference.
   */
  delete(conversationId: string, reference: string): Promise<void>;

  /**
   * Deletes all product references belonging to a conversation.
   *
   * @param conversationId - Conversation identifier.
   */
  deleteAllByConversationId(conversationId: string): Promise<void>;
}
