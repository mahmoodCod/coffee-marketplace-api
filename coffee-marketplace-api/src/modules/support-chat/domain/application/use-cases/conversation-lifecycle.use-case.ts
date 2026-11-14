import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { Conversation } from '../../../domain/entities/conversation.entity';
import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import type { ConversationRepository } from '../../../domain/repositories/conversation.repository';

import { SUPPORT_CHAT_TOKENS } from '../../../constants/support-chat.tokens';

/**
 * ------------------------------------------------------------------------
 * Conversation Lifecycle Use Case
 * ------------------------------------------------------------------------
 *
 * Handles conversation creation, access, lifecycle, and ownership transfer.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class ConversationLifecycleUseCase {
  constructor(
    @Inject(SUPPORT_CHAT_TOKENS.CONVERSATION_REPOSITORY)
    private readonly conversationRepository: ConversationRepository,
  ) {}

  /**
   * Creates a new conversation for the specified owner.
   */
  async create(
    owner: ConversationOwner,
    ttlSeconds: number,
  ): Promise<Conversation> {
    this.validateOwner(owner);
    this.validateTtl(ttlSeconds);

    const now = new Date();

    const conversation = Conversation.create({
      id: randomUUID(),
      owner,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttlSeconds * 1000),
    });

    await this.conversationRepository.create(conversation);

    return conversation;
  }

  /**
   * Retrieves a conversation after verifying its ownership.
   */
  async get(
    conversationId: string,
    requester: ConversationOwner,
  ): Promise<Conversation> {
    return this.getAccessibleConversation(conversationId, requester);
  }

  /**
   * Closes an active conversation.
   */
  async close(
    conversationId: string,
    requester: ConversationOwner,
  ): Promise<void> {
    const conversation = await this.getAccessibleConversation(
      conversationId,
      requester,
    );

    conversation.close();

    await this.conversationRepository.save(conversation);
  }

  /**
   * Extends the expiration time of an active conversation.
   */
  async refreshExpiration(
    conversationId: string,
    requester: ConversationOwner,
    ttlSeconds: number,
  ): Promise<Conversation> {
    const conversation = await this.getAccessibleConversation(
      conversationId,
      requester,
    );

    this.validateTtl(ttlSeconds);

    conversation.refreshExpiration(ttlSeconds);

    await this.conversationRepository.save(conversation);

    return conversation;
  }

  /**
   * Transfers a guest conversation to an authenticated user.
   *
   * The caller must invoke this operation only after receiving
   * explicit confirmation from the guest.
   */
  async transferOwnership(
    conversationId: string,
    requester: ConversationOwner,
    newOwner: ConversationOwner,
    hasExplicitConsent: boolean,
  ): Promise<Conversation> {
    this.validateOwner(requester);
    this.validateOwner(newOwner);

    if (requester.type !== 'guest' || newOwner.type !== 'user') {
      throw new Error('Only guest conversations can be transferred to users.');
    }

    if (!hasExplicitConsent) {
      throw new Error('Explicit user consent is required.');
    }

    const conversation = await this.getAccessibleConversation(
      conversationId,
      requester,
    );

    // Update ownership in the domain aggregate.
    conversation.transferOwnership(newOwner);

    // Persist ownership change only if the guest is still the current owner.
    await this.conversationRepository.transferOwnership(
      conversation,
      requester,
    );

    return conversation;
  }

  /**
   * Retrieves an accessible conversation owned by the requester.
   */
  private async getAccessibleConversation(
    conversationId: string,
    requester: ConversationOwner,
  ): Promise<Conversation> {
    if (typeof conversationId !== 'string' || !conversationId.trim()) {
      throw new Error('Conversation ID is required.');
    }

    this.validateOwner(requester);

    const conversation = await this.conversationRepository.findById(
      conversationId.trim(),
    );

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    // Validate ownership, status, and expiration through the aggregate.
    conversation.assertAccessible(requester);

    return conversation;
  }

  /**
   * Validates a conversation owner.
   */
  private validateOwner(owner: ConversationOwner): void {
    if (
      !owner ||
      typeof owner.id !== 'string' ||
      !owner.id.trim() ||
      !['guest', 'user'].includes(owner.type)
    ) {
      throw new Error('A valid conversation owner is required.');
    }
  }

  /**
   * Validates a positive conversation lifetime.
   */
  private validateTtl(ttlSeconds: number): void {
    if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error('TTL must be a positive safe integer.');
    }
  }
}
