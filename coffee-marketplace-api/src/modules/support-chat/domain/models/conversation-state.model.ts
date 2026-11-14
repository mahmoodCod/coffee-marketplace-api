/**
 * Represents the current conversational state.
 *
 * This state stores contextual information needed
 * to continue a conversation across multiple requests.
 */
export interface ConversationState {
  /** ID of the conversation this state belongs to. */
  readonly conversationId: string;

  /**
   * Opaque reference to the currently selected product.
   *
   * This reference is conversation-scoped and must not
   * expose the actual database product ID to the AI model.
   */
  readonly activeProductReference: string | null;

  /** Timestamp of the last state update. */
  readonly updatedAt: Date;
}

/**
 * Defines the data required to create a conversation state.
 */
export interface CreateConversationStateInput {
  conversationId: string;
  activeProductReference?: string | null;
  updatedAt?: Date;
}
