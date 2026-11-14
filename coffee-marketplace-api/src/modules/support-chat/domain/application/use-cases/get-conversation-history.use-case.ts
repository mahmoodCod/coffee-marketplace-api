import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import { ConversationTurn } from '../../../domain/models/conversation-message.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import { ConversationTurnRepository } from '../../../domain/repositories/conversation-turn.repository';

/**
 * Defines the data required to retrieve conversation history.
 */
export interface GetConversationHistoryQuery {
  conversationId: string;
  requester: ConversationOwner;
  limit?: number;
}

/**
 * Retrieves recent conversation turns for the conversation owner.
 *
 * Each turn is returned as a complete unit to preserve
 * assistant tool calls and their corresponding tool results.
 */
export class GetConversationHistoryUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly conversationTurnRepository: ConversationTurnRepository,
  ) {}

  /**
   * Executes the conversation history retrieval workflow.
   */
  async execute(
    query: GetConversationHistoryQuery,
  ): Promise<ConversationTurn[]> {
    // Validate the conversation identifier.
    if (
      typeof query.conversationId !== 'string' ||
      query.conversationId.trim().length === 0
    ) {
      throw new Error('Conversation ID is required.');
    }

    // Validate the requester identity.
    if (
      !query.requester?.id ||
      !['guest', 'user'].includes(query.requester.type)
    ) {
      throw new Error('A valid requester identity is required.');
    }

    // Apply a safe default and enforce the maximum history size.
    const limit = query.limit ?? 20;

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('History limit must be between 1 and 100.');
    }

    // Retrieve the conversation before accessing its history.
    const conversation = await this.conversationRepository.findById(
      query.conversationId,
    );

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    // Ensure that the requester owns this conversation.
    if (
      conversation.owner.id !== query.requester.id ||
      conversation.owner.type !== query.requester.type
    ) {
      throw new Error('You are not allowed to access this conversation.');
    }

    // Reject access to closed or expired conversations.
    conversation.assertAccessible();

    // Retrieve complete turns in chronological order.
    return this.conversationTurnRepository.findRecent(
      query.conversationId,
      limit,
    );
  }
}
