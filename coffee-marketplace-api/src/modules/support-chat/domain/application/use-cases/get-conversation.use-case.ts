import { Conversation } from '../../entities/conversation.entity';
import { ConversationOwner } from '../../models/conversation-owner.model';
import { ConversationRepository } from '../../repositories/conversation.repository';

/**
 * Defines the input required to retrieve a conversation.
 */
export interface GetConversationQuery {
  /** Unique identifier of the requested conversation. */
  conversationId: string;

  /** Identity of the user or guest requesting access. */
  requester: ConversationOwner;
}

/**
 * Retrieves a conversation after validating ownership and accessibility.
 *
 * A conversation ID alone must never grant access to its data.
 */
export class GetConversationUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  /**
   * Executes the conversation retrieval process.
   */
  async execute(query: GetConversationQuery): Promise<Conversation> {
    // Validate the requested conversation identifier.
    if (!query.conversationId?.trim()) {
      throw new Error('Conversation ID is required.');
    }

    // Validate the requester identity.
    if (!query.requester?.id?.trim()) {
      throw new Error('Requester identity is required.');
    }

    if (!['guest', 'user'].includes(query.requester.type)) {
      throw new Error('Invalid requester type.');
    }

    // Retrieve the conversation from the repository.
    const conversation = await this.conversationRepository.findById(
      query.conversationId,
    );

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    // Verify that the requester owns this conversation.
    const owner = conversation.owner;

    if (
      owner.type !== query.requester.type ||
      owner.id !== query.requester.id
    ) {
      throw new Error('Access to this conversation is denied.');
    }

    // Reject closed or expired conversations.
    conversation.assertAccessible();

    return conversation;
  }
}
