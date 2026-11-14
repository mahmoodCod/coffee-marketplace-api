import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import { ProductReferenceRepository } from '../../../domain/repositories/product-reference.repository';

/**
 * Defines the data required to delete all product references
 * associated with a conversation.
 */
export interface DeleteConversationProductReferencesCommand {
  conversationId: string;
  requester: ConversationOwner;
}

/**
 * Deletes all product references belonging to a conversation.
 *
 * The operation only removes conversational references.
 * Actual catalog products remain unchanged.
 */
export class DeleteConversationProductReferencesUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly productReferenceRepository: ProductReferenceRepository,
  ) {}

  /**
   * Executes the conversation product reference cleanup workflow.
   */
  async execute(
    command: DeleteConversationProductReferencesCommand,
  ): Promise<void> {
    // Validate the conversation identifier.
    if (
      typeof command.conversationId !== 'string' ||
      command.conversationId.trim().length === 0
    ) {
      throw new Error('Conversation ID is required.');
    }

    // Validate the requester identity.
    if (
      !command.requester?.id ||
      !['guest', 'user'].includes(command.requester.type)
    ) {
      throw new Error('A valid requester identity is required.');
    }

    // Retrieve the conversation before deleting its references.
    const conversation = await this.conversationRepository.findById(
      command.conversationId,
    );

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    // Ensure that the requester owns this conversation.
    if (
      conversation.owner.id !== command.requester.id ||
      conversation.owner.type !== command.requester.type
    ) {
      throw new Error('You are not allowed to access this conversation.');
    }

    // Reject modifications to closed or expired conversations.
    conversation.assertAccessible();

    // Remove every product reference associated with this conversation.
    await this.productReferenceRepository.deleteAllByConversationId(
      command.conversationId,
    );
  }
}
