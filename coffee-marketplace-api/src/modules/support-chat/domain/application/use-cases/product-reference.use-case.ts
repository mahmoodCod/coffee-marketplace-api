import { randomBytes } from 'node:crypto';

import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import {
  ConversationProductReference,
  ProductReferenceSource,
} from '../../../domain/models/product-reference.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import { ProductReferenceRepository } from '../../../domain/repositories/product-reference.repository';

/**
 * Groups all product reference operations related to a conversation.
 */
export class ProductReferenceUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly productReferenceRepository: ProductReferenceRepository,
  ) {}

  /**
   * Creates an opaque product reference for a conversation.
   */
  async create(
    conversationId: string,
    requester: ConversationOwner,
    productId: string,
    source: ProductReferenceSource,
  ): Promise<ConversationProductReference> {
    const conversation = await this.getAccessibleConversation(
      conversationId,
      requester,
    );

    // Validate the internal product identifier.
    if (typeof productId !== 'string' || !productId.trim()) {
      throw new Error('Product ID is required.');
    }

    // Validate the reference source.
    if (!['catalog_search', 'product_details'].includes(source)) {
      throw new Error('Invalid product reference source.');
    }

    // Generate an unpredictable reference without exposing the product ID.
    const productReference: ConversationProductReference = {
      reference: `prod_${randomBytes(16).toString('hex')}`,
      conversationId: conversation.id,
      productId,
      source,
      createdAt: new Date(),
    };

    await this.productReferenceRepository.save(productReference);

    return productReference;
  }

  /**
   * Retrieves one product reference within its conversation.
   */
  async getByReference(
    conversationId: string,
    requester: ConversationOwner,
    reference: string,
  ): Promise<ConversationProductReference> {
    await this.getAccessibleConversation(conversationId, requester);
    this.validateReference(reference);

    const productReference =
      await this.productReferenceRepository.findByReference(
        conversationId,
        reference,
      );

    if (!productReference) {
      throw new Error('Product reference not found.');
    }

    return productReference;
  }

  /**
   * Retrieves all product references belonging to a conversation.
   */
  async getAll(
    conversationId: string,
    requester: ConversationOwner,
  ): Promise<ConversationProductReference[]> {
    await this.getAccessibleConversation(conversationId, requester);

    return this.productReferenceRepository.findAllByConversationId(
      conversationId,
    );
  }

  /**
   * Deletes one product reference without deleting the actual product.
   */
  async delete(
    conversationId: string,
    requester: ConversationOwner,
    reference: string,
  ): Promise<void> {
    await this.getAccessibleConversation(conversationId, requester);
    this.validateReference(reference);

    // Ensure that the reference belongs to the current conversation.
    const productReference =
      await this.productReferenceRepository.findByReference(
        conversationId,
        reference,
      );

    if (!productReference) {
      throw new Error('Product reference not found.');
    }

    await this.productReferenceRepository.delete(conversationId, reference);
  }

  /**
   * Deletes all product references belonging to a conversation.
   */
  async deleteAll(
    conversationId: string,
    requester: ConversationOwner,
  ): Promise<void> {
    await this.getAccessibleConversation(conversationId, requester);

    await this.productReferenceRepository.deleteAllByConversationId(
      conversationId,
    );
  }

  /**
   * Retrieves an active conversation after validating its ownership.
   */
  private async getAccessibleConversation(
    conversationId: string,
    requester: ConversationOwner,
  ) {
    // Validate the conversation identifier.
    if (typeof conversationId !== 'string' || !conversationId.trim()) {
      throw new Error('Conversation ID is required.');
    }

    // Validate the requester identity.
    if (!requester?.id || !['guest', 'user'].includes(requester.type)) {
      throw new Error('A valid requester identity is required.');
    }

    const conversation =
      await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    // Prevent access to another user's or guest's conversation.
    if (
      conversation.owner.id !== requester.id ||
      conversation.owner.type !== requester.type
    ) {
      throw new Error('You are not allowed to access this conversation.');
    }

    conversation.assertActive();

    return conversation;
  }

  /**
   * Validates the format of an opaque product reference.
   */
  private validateReference(reference: string): void {
    if (
      typeof reference !== 'string' ||
      !/^prod_[a-f0-9]{32}$/.test(reference)
    ) {
      throw new Error('A valid product reference is required.');
    }
  }
}
