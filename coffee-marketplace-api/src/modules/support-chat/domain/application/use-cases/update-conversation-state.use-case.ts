import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import { ConversationState } from '../../../domain/models/conversation-state.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import { ConversationStateRepository } from '../../../domain/repositories/conversation-state.repository';

/**
 * Defines the input required to update conversation state.
 */
export interface UpdateConversationStateCommand {
  /** Conversation whose state will be updated. */
  conversationId: string;

  /** Identity of the user or guest requesting the update. */
  requester: ConversationOwner;

  /**
   * Opaque reference of the active product.
   * Set to null to clear the currently selected product.
   */
  activeProductReference: string | null;
}

/**
 * Updates the contextual state of a conversation.
 *
 * Only the conversation owner can modify its state.
 * Product references must be generated and validated by the backend.
 */
export class UpdateConversationStateUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly conversationStateRepository: ConversationStateRepository,
  ) {}

  /**
   * Executes the conversation state update process.
   */
  async execute(
    command: UpdateConversationStateCommand,
  ): Promise<ConversationState> {
    // Validate the conversation identifier.
    if (!command.conversationId?.trim()) {
      throw new Error('Conversation ID is required.');
    }

    // Validate the requester identity.
    if (!command.requester?.id?.trim()) {
      throw new Error('Requester identity is required.');
    }

    if (!['guest', 'user'].includes(command.requester.type)) {
      throw new Error('Invalid requester type.');
    }

    // Validate the product reference when one is provided.
    if (
      command.activeProductReference !== null &&
      (typeof command.activeProductReference !== 'string' ||
        !command.activeProductReference.trim())
    ) {
      throw new Error('A valid product reference is required.');
    }

    // Retrieve the conversation before modifying its state.
    const conversation = await this.conversationRepository.findById(
      command.conversationId,
    );

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    // Verify that the requester owns the conversation.
    const owner = conversation.owner;

    if (
      owner.type !== command.requester.type ||
      owner.id !== command.requester.id
    ) {
      throw new Error('Access to this conversation is denied.');
    }

    // Reject updates to closed or expired conversations.
    conversation.assertAccessible();

    // Create the updated conversation state.
    const state: ConversationState = {
      conversationId: command.conversationId,
      activeProductReference: command.activeProductReference,
      updatedAt: new Date(),
    };

    // Persist the state using the repository contract.
    await this.conversationStateRepository.save(state);

    return state;
  }
}
