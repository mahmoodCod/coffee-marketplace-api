import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import { ConversationProductReference } from '../../../domain/models/product-reference.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import { ProductReferenceRepository } from '../../../domain/repositories/product-reference.repository';

/**
 * Defines the data required to retrieve a product reference.
 */
export interface GetProductReferenceQuery {
  conversationId: string;
  requester: ConversationOwner;
  reference: string;
}

/**
 * Retrieves a product reference within its owning conversation.
 *
 * The actual product ID remains internal to the backend.
 */
export class GetProductReferenceUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly productReferenceRepository: ProductReferenceRepository,
  ) {}

  /**
   * Executes the product reference retrieval workflow.
   */
  async execute(
    query: GetProductReferenceQuery,
  ): Promise<ConversationProductReference> {
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

    // Validate the opaque product reference.
    if (
      typeof query.reference !== 'string' ||
      !/^prod_[a-f0-9]{32}$/.test(query.reference)
    ) {
      throw new Error('A valid product reference is required.');
    }

    // Retrieve the conversation before accessing its product references.
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

    // Search for the reference inside the current conversation only.
    const productReference =
      await this.productReferenceRepository.findByReference(
        query.conversationId,
        query.reference,
      );

    if (!productReference) {
      throw new Error('Product reference not found.');
    }

    // Return the internal reference to the backend application layer.
    return productReference;
  }
}
