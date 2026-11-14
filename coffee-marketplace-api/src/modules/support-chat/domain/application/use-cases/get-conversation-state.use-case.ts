import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import { ConversationState } from '../../../domain/models/conversation-state.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import { ConversationStateRepository } from '../../../domain/repositories/conversation-state.repository';

/**
 * Defines the data required to retrieve a conversation state.
 */
export interface GetConversationStateQuery {
  conversationId: string;
  requester: ConversationOwner;
}

/**
 * Retrieves the current state of a conversation.
 *
 * The requester must own an active conversation.
 */
export class GetConversationStateUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly conversationStateRepository: ConversationStateRepository,
  ) {}

  /**
   * Executes the conversation state retrieval workflow.
   */
  async execute(
    query: GetConversationStateQuery,
  ): Promise<ConversationState | null> {
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

    // Retrieve the conversation from the repository.
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

    // Retrieve the persisted conversational state.
    return this.conversationStateRepository.findByConversationId(
      query.conversationId,
    );
  }
}
