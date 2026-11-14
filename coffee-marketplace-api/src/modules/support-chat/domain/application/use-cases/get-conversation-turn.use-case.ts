import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import { ConversationTurn } from '../../../domain/models/conversation-message.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import { ConversationTurnRepository } from '../../../domain/repositories/conversation-turn.repository';

/**
 * Defines the data required to retrieve a conversation turn.
 */
export interface GetConversationTurnQuery {
  conversationId: string;
  requester: ConversationOwner;
  requestId: string;
}

/**
 * Retrieves a specific conversation turn by its request ID.
 *
 * The complete turn is returned to preserve message relationships.
 */
export class GetConversationTurnUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly conversationTurnRepository: ConversationTurnRepository,
  ) {}

  /**
   * Executes the conversation turn retrieval workflow.
   */
  async execute(
    query: GetConversationTurnQuery,
  ): Promise<ConversationTurn | null> {
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

    // Validate the request identifier.
    if (
      typeof query.requestId !== 'string' ||
      query.requestId.trim().length === 0
    ) {
      throw new Error('Request ID is required.');
    }

    // Retrieve the conversation before accessing its turns.
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

    // Retrieve the requested turn within this conversation.
    return this.conversationTurnRepository.findByRequestId(
      query.conversationId,
      query.requestId,
    );
  }
}
