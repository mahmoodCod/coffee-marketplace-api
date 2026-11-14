import { ConversationOwner } from '../../models/conversation-owner.model';
import { ConversationRepository } from '../../repositories/conversation.repository';

/**
 * Defines the input required to close a conversation.
 */
export interface CloseConversationCommand {
  /** Unique identifier of the conversation to close. */
  conversationId: string;

  /** Identity of the user or guest requesting the closure. */
  requester: ConversationOwner;
}

/**
 * Closes an existing conversation.
 *
 * Only the conversation owner can close it.
 * The operation is persisted through the repository contract.
 */
export class CloseConversationUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  /**
   * Executes the conversation closure process.
   */
  async execute(command: CloseConversationCommand): Promise<void> {
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

    // Retrieve the conversation before performing any operation.
    const conversation = await this.conversationRepository.findById(
      command.conversationId,
    );

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    // Ensure that only the owner can close the conversation.
    const owner = conversation.owner;

    if (
      owner.type !== command.requester.type ||
      owner.id !== command.requester.id
    ) {
      throw new Error('Access to this conversation is denied.');
    }

    // Apply the domain lifecycle transition.
    conversation.close();

    // Persist the updated conversation.
    await this.conversationRepository.save(conversation);
  }
}
