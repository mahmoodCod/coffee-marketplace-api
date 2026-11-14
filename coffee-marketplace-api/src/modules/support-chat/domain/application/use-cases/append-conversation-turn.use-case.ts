import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import { ConversationTurn } from '../../../domain/models/conversation-message.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import { ConversationTurnRepository } from '../../../domain/repositories/conversation-turn.repository';

/**
 * Defines the data required to append a conversation turn.
 */
export interface AppendConversationTurnCommand {
  conversationId: string;
  requester: ConversationOwner;
  turn: ConversationTurn;
}

/**
 * Appends a complete interaction to the conversation history.
 *
 * Duplicate request IDs are rejected by the repository to
 * provide idempotent persistence.
 */
export class AppendConversationTurnUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly conversationTurnRepository: ConversationTurnRepository,
  ) {}

  /**
   * Executes the conversation turn append workflow.
   *
   * @returns True when the turn is stored, or false when it is a duplicate.
   */
  async execute(command: AppendConversationTurnCommand): Promise<boolean> {
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

    // Validate the conversation turn.
    if (!command.turn || typeof command.turn !== 'object') {
      throw new Error('A valid conversation turn is required.');
    }

    if (
      typeof command.turn.requestId !== 'string' ||
      command.turn.requestId.trim().length === 0
    ) {
      throw new Error('Turn request ID is required.');
    }

    if (
      !Number.isSafeInteger(command.turn.sequence) ||
      command.turn.sequence < 1
    ) {
      throw new Error('Turn sequence must be a positive safe integer.');
    }

    if (
      !Array.isArray(command.turn.messages) ||
      command.turn.messages.length === 0
    ) {
      throw new Error('A conversation turn must contain messages.');
    }

    if (
      !(command.turn.createdAt instanceof Date) ||
      Number.isNaN(command.turn.createdAt.getTime())
    ) {
      throw new Error('A valid turn creation date is required.');
    }

    // Ensure that the turn belongs to the requested conversation.
    if (
      command.turn.messages.some(
        (message) => message.conversationId !== command.conversationId,
      )
    ) {
      throw new Error(
        'Turn messages must belong to the requested conversation.',
      );
    }

    // Retrieve the conversation before modifying its history.
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

    // Persist the complete turn atomically through the repository.
    return this.conversationTurnRepository.append(
      command.conversationId,
      command.turn,
    );
  }
}
