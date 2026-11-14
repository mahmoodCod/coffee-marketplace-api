import { randomBytes } from 'node:crypto';

import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import {
  ConversationProductReference,
  ProductReferenceSource,
} from '../../../domain/models/product-reference.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import { ProductReferenceRepository } from '../../../domain/repositories/product-reference.repository';

/**
 * Defines the data required to create a product reference.
 */
export interface CreateProductReferenceCommand {
  conversationId: string;
  requester: ConversationOwner;
  productId: string;
  source: ProductReferenceSource;
}

/**
 * Creates an opaque, conversation-scoped reference for a product.
 *
 * The actual database product ID is kept inside the backend
 * and is never exposed to the AI model.
 */
export class CreateProductReferenceUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly productReferenceRepository: ProductReferenceRepository,
  ) {}

  /**
   * Executes the product reference creation workflow.
   */
  async execute(
    command: CreateProductReferenceCommand,
  ): Promise<ConversationProductReference> {
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

    // Validate the internal product identifier.
    if (
      typeof command.productId !== 'string' ||
      command.productId.trim().length === 0
    ) {
      throw new Error('Product ID is required.');
    }

    // Validate the reference source.
    if (!['catalog_search', 'product_details'].includes(command.source)) {
      throw new Error('A valid product reference source is required.');
    }

    // Retrieve the conversation before creating a reference.
    const conversation = await this.conversationRepository.findById(
      command.conversationId,
    );

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    // Ensure that the requester owns the conversation.
    if (
      conversation.owner.id !== command.requester.id ||
      conversation.owner.type !== command.requester.type
    ) {
      throw new Error('You are not allowed to access this conversation.');
    }

    // Reject reference creation for closed or expired conversations.
    conversation.assertAccessible();

    // Generate an unpredictable reference that does not expose the product ID.
    const reference = `prod_${randomBytes(16).toString('hex')}`;

    const productReference: ConversationProductReference = {
      reference,
      conversationId: command.conversationId,
      productId: command.productId,
      source: command.source,
      createdAt: new Date(),
    };

    // Persist the reference with its conversation ownership.
    await this.productReferenceRepository.save(productReference);

    return productReference;
  }
}
