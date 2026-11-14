import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import { ProductReferenceRepository } from '../../../domain/repositories/product-reference.repository';

/**
 * Defines the data required to delete a product reference.
 */
export interface DeleteProductReferenceCommand {
  conversationId: string;
  requester: ConversationOwner;
  reference: string;
}

/**
 * Deletes a product reference from its owning conversation.
 *
 * The operation does not delete the actual product from the catalog.
 */
export class DeleteProductReferenceUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly productReferenceRepository: ProductReferenceRepository,
  ) {}

  /**
   * Executes the product reference deletion workflow.
   */
  async execute(command: DeleteProductReferenceCommand): Promise<void> {
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

    // Validate the opaque product reference.
    if (
      typeof command.reference !== 'string' ||
      !/^prod_[a-f0-9]{32}$/.test(command.reference)
    ) {
      throw new Error('A valid product reference is required.');
    }

    // Retrieve the conversation before modifying its references.
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

    // Ensure that the reference belongs to this conversation.
    const productReference =
      await this.productReferenceRepository.findByReference(
        command.conversationId,
        command.reference,
      );

    if (!productReference) {
      throw new Error('Product reference not found.');
    }

    // Delete only the conversation-scoped reference.
    await this.productReferenceRepository.delete(
      command.conversationId,
      command.reference,
    );
  }
}
