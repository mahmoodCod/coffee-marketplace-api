import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';

/**
 * Defines the input required to transfer a guest conversation.
 */
export interface TransferGuestConversationCommand {
  /** Conversation that will be transferred. */
  conversationId: string;

  /** Current guest identity requesting the transfer. */
  requester: ConversationOwner;

  /** Authenticated user who will own the conversation. */
  newOwner: ConversationOwner;

  /**
   * Indicates that the guest explicitly confirmed the transfer.
   *
   * This value must be set by the application layer only
   * after receiving explicit confirmation from the user.
   */
  hasExplicitConsent: boolean;
}

/**
 * Transfers a guest conversation to an authenticated user.
 *
 * Conversation history must never be transferred automatically
 * when a guest signs in.
 */
export class TransferGuestConversationUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  /**
   * Executes the guest conversation ownership transfer.
   */
  async execute(command: TransferGuestConversationCommand): Promise<void> {
    // Validate the conversation identifier.
    if (!command.conversationId?.trim()) {
      throw new Error('Conversation ID is required.');
    }

    // Validate the current guest identity.
    if (!command.requester?.id?.trim()) {
      throw new Error('Guest identity is required.');
    }

    if (command.requester.type !== 'guest') {
      throw new Error('Only guest conversations can be transferred.');
    }

    // Validate the authenticated destination user.
    if (!command.newOwner?.id?.trim()) {
      throw new Error('New owner ID is required.');
    }

    if (command.newOwner.type !== 'user') {
      throw new Error('The new owner must be an authenticated user.');
    }

    // Require explicit user confirmation before transferring history.
    if (command.hasExplicitConsent !== true) {
      throw new Error('Explicit user consent is required.');
    }

    // Retrieve the conversation before changing its ownership.
    const conversation = await this.conversationRepository.findById(
      command.conversationId,
    );

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    // Verify that the requesting guest owns the conversation.
    const currentOwner = conversation.owner;

    if (
      currentOwner.type !== command.requester.type ||
      currentOwner.id !== command.requester.id
    ) {
      throw new Error('Access to this conversation is denied.');
    }

    // Apply the ownership transfer through the domain entity.
    conversation.transferOwnership(command.newOwner);

    // Persist the updated conversation.
    await this.conversationRepository.save(conversation);
  }
}
