import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import { ConversationTurn } from '../../../domain/models/conversation-message.model';
import type { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import type { ConversationTurnRepository } from '../../../domain/repositories/conversation-turn.repository';
import { Inject, Injectable } from '@nestjs/common';
import { SUPPORT_CHAT_TOKENS } from 'src/modules/support-chat/constants/support-chat.tokens';

/**
 * Handles conversation history operations.
 */
@Injectable()
export class ConversationHistoryUseCase {
  constructor(
    @Inject(SUPPORT_CHAT_TOKENS.CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepository,

    @Inject(SUPPORT_CHAT_TOKENS.CONVERSATION_TURN_REPOSITORY)
    private readonly conversationTurnRepository: ConversationTurnRepository,
  ) {}

  /**
   * Retrieves recent conversation turns in chronological order.
   */
  async getHistory(
    conversationId: string,
    requester: ConversationOwner,
    limit = 20,
  ): Promise<ConversationTurn[]> {
    await this.getAccessibleConversation(conversationId, requester);

    // Validate the requested history size.
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error('History limit must be between 1 and 100.');
    }

    return this.conversationTurnRepository.findRecent(conversationId, limit);
  }

  /**
   * Retrieves a specific conversation turn by its request ID.
   */
  async getTurn(
    conversationId: string,
    requester: ConversationOwner,
    requestId: string,
  ): Promise<ConversationTurn | null> {
    await this.getAccessibleConversation(conversationId, requester);

    // Validate the request identifier.
    if (typeof requestId !== 'string' || !requestId.trim()) {
      throw new Error('Request ID is required.');
    }

    return this.conversationTurnRepository.findByRequestId(
      conversationId,
      requestId,
    );
  }

  /**
   * Appends a complete turn to the conversation history.
   *
   * The repository is responsible for atomic persistence,
   * ordering, and duplicate request prevention.
   */
  async appendTurn(
    conversationId: string,
    requester: ConversationOwner,
    turn: ConversationTurn,
  ): Promise<boolean> {
    await this.getAccessibleConversation(conversationId, requester);

    // Validate the turn structure.
    if (!turn || typeof turn !== 'object') {
      throw new Error('A valid conversation turn is required.');
    }

    if (typeof turn.requestId !== 'string' || !turn.requestId.trim()) {
      throw new Error('Turn request ID is required.');
    }

    if (!Number.isSafeInteger(turn.sequence) || turn.sequence < 1) {
      throw new Error('Turn sequence must be a positive safe integer.');
    }

    if (!Array.isArray(turn.messages) || turn.messages.length === 0) {
      throw new Error('A conversation turn must contain messages.');
    }

    if (
      turn.messages.some(
        (message) => !message || message.conversationId !== conversationId,
      )
    ) {
      throw new Error(
        'All turn messages must belong to the requested conversation.',
      );
    }

    if (
      !(turn.createdAt instanceof Date) ||
      Number.isNaN(turn.createdAt.getTime())
    ) {
      throw new Error('A valid turn creation date is required.');
    }

    return this.conversationTurnRepository.append(conversationId, turn);
  }

  /**
   * Deletes all history associated with an accessible conversation.
   */
  async clearHistory(
    conversationId: string,
    requester: ConversationOwner,
  ): Promise<void> {
    await this.getAccessibleConversation(conversationId, requester);

    await this.conversationTurnRepository.deleteAll(conversationId);
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

    // Prevent access to conversations owned by other identities.
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
