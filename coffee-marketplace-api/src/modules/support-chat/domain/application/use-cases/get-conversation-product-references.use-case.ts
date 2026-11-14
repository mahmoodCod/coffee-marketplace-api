import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import { ConversationProductReference } from '../../../domain/models/product-reference.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import { ProductReferenceRepository } from '../../../domain/repositories/product-reference.repository';

/**
 * Defines the data required to retrieve conversation product references.
 */
export interface GetConversationProductReferencesQuery {
  conversationId: string;
  requester: ConversationOwner;
}

/**
 * Retrieves all product references associated with a conversation.
 *
 * References are only accessible to the conversation owner.
 */
export class GetConversationProductReferencesUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly productReferenceRepository: ProductReferenceRepository,
  ) {}

  /**
   * Executes the conversation product reference retrieval workflow.
   */
  async execute(
    query: GetConversationProductReferencesQuery,
  ): Promise<ConversationProductReference[]> {
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

    // Retrieve the conversation before accessing its references.
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

    // Retrieve references scoped to the current conversation.
    return this.productReferenceRepository.findAllByConversationId(
      query.conversationId,
    );
  }
}
