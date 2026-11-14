import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import { ConversationState } from '../../../domain/models/conversation-state.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import { ConversationStateRepository } from '../../../domain/repositories/conversation-state.repository';
import { ProductReferenceRepository } from '../../../domain/repositories/product-reference.repository';

/**
 * Handles conversation state retrieval and updates.
 */
export class ConversationStateUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly conversationStateRepository: ConversationStateRepository,
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
   * Updates the active product reference of a conversation.
   *
   * Passing null clears the currently selected product.
   */
  async update(
    conversationId: string,
    requester: ConversationOwner,
    activeProductReference: string | null,
  ): Promise<ConversationState> {
    await this.getAccessibleConversation(conversationId, requester);

    // Validate the supplied product reference.
    if (activeProductReference !== null) {
      if (
        typeof activeProductReference !== 'string' ||
        !/^prod_[a-f0-9]{32}$/.test(activeProductReference)
      ) {
        throw new Error('A valid product reference is required.');
      }

      // Ensure that the reference belongs to this conversation.
      const productReference =
        await this.productReferenceRepository.findByReference(
          conversationId,
          activeProductReference,
        );

      if (!productReference) {
        throw new Error(
          'The product reference does not belong to this conversation.',
        );
      }
    }

    const state: ConversationState = {
      conversationId,
      activeProductReference,
      updatedAt: new Date(),
    };

    await this.conversationStateRepository.save(state);

    return state;
  }

  /**
   * Retrieves a conversation after validating requester ownership.
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

    // Prevent access to another owner's conversation.
    if (
      conversation.owner.id !== requester.id ||
      conversation.owner.type !== requester.type
    ) {
      throw new Error('You are not allowed to access this conversation.');
    }

    conversation.assertAccessible();

    return conversation;
  }
}
