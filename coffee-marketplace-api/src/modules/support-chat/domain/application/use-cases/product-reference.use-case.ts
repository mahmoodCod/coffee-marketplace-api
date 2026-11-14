import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';

import { ConversationOwner } from '../../models/conversation-owner.model';
import {
  ConversationProductReference,
  ProductReferenceSource,
} from '../../models/product-reference.model';

import type { ConversationRepository } from '../../repositories/conversation.repository';
import type { ProductReferenceRepository } from '../../repositories/product-reference.repository';

import { SUPPORT_CHAT_TOKENS } from '../../../constants/support-chat.tokens';

/**
 * ------------------------------------------------------------------------
 * Product Reference Use Case
 * ------------------------------------------------------------------------
 *
 * Groups all product reference operations related to a conversation.
 *
 * Security:
 * - Product IDs are never exposed as public references.
 * - References are unpredictable and scoped to a conversation.
 * - Every operation validates conversation ownership.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class ProductReferenceUseCase {
  constructor(
    @Inject(SUPPORT_CHAT_TOKENS.CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepository,

    @Inject(SUPPORT_CHAT_TOKENS.PRODUCT_REFERENCE_REPOSITORY)
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
      productId: productId.trim(),
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

    const conversation = await this.conversationRepository.findById(
      conversationId.trim(),
    );

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    // Validate both ownership and conversation expiration/status.
    conversation.assertAccessible(requester);

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
