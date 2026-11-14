import { Inject, Injectable } from '@nestjs/common';

import { ConversationOwner } from '../../models/conversation-owner.model';
import { ConversationState } from '../../models/conversation-state.model';

import type { ConversationRepository } from '../../repositories/conversation.repository';
import type { ConversationStateRepository } from '../../repositories/conversation-state.repository';
import type { ProductReferenceRepository } from '../../repositories/product-reference.repository';

import { SUPPORT_CHAT_TOKENS } from '../../../constants/support-chat.tokens';

/**
 * ------------------------------------------------------------------------
 * Conversation State Use Case
 * ------------------------------------------------------------------------
 *
 * Manages temporary state associated with a support chat conversation.
 *
 * Responsibilities:
 * - Retrieve conversation state.
 * - Update the active product reference.
 * - Ensure referenced products belong to the same conversation.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class ConversationStateUseCase {
  constructor(
    @Inject(SUPPORT_CHAT_TOKENS.CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepository,

    @Inject(SUPPORT_CHAT_TOKENS.CONVERSATION_STATE_REPOSITORY)
    private readonly conversationStateRepository: ConversationStateRepository,

    @Inject(SUPPORT_CHAT_TOKENS.PRODUCT_REFERENCE_REPOSITORY)
    private readonly productReferenceRepository: ProductReferenceRepository,
  ) {}

  /**
   * Retrieves the current state of an accessible conversation.
   */
  async get(
    conversationId: string,
    requester: ConversationOwner,
  ): Promise<ConversationState | null> {
    await this.getAccessibleConversation(conversationId, requester);

    return this.conversationStateRepository.findByConversationId(
      conversationId,
    );
  }

  /**
   * Updates the conversation state after validating its product reference.
   */
  async update(
    conversationId: string,
    requester: ConversationOwner,
    state: ConversationState,
  ): Promise<void> {
    await this.getAccessibleConversation(conversationId, requester);

    if (state.conversationId !== conversationId) {
      throw new Error('Conversation state does not match the conversation.');
    }

    if (state.activeProductReference) {
      const productReference =
        await this.productReferenceRepository.findByReference(
          conversationId,
          state.activeProductReference,
        );

      if (
        !productReference ||
        productReference.conversationId !== conversationId
      ) {
        throw new Error('Product reference is not accessible.');
      }
    }

    await this.conversationStateRepository.save(state);
  }

  /**
   * Ensures the requester owns an active conversation.
   */
  private async getAccessibleConversation(
    conversationId: string,
    requester: ConversationOwner,
  ) {
    if (!conversationId?.trim()) {
      throw new Error('Conversation ID is required.');
    }

    if (!requester?.id?.trim()) {
      throw new Error('Conversation requester is required.');
    }

    const conversation =
      await this.conversationRepository.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    conversation.assertAccessible(requester);

    return conversation;
  }
}
