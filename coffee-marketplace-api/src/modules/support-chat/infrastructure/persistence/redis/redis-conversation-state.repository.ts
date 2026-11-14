import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../../../redis/redis.service';
import type { ConversationStateRepository } from '../../../domain/repositories/conversation-state.repository';
import type { ConversationState } from '../../../domain/models/conversation-state.model';

@Injectable()
export class RedisConversationStateRepository implements ConversationStateRepository {
  private readonly keyPrefix = 'support-chat:state:';
  private readonly ttlSeconds = 24 * 60 * 60;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Generates the Redis key for a conversation state.
   */
  private getKey(conversationId: string): string {
    return `${this.keyPrefix}{${conversationId}}`;
  }

  /**
   * Validates the conversation identifier.
   */
  private validateConversationId(conversationId: string): void {
    if (!conversationId || !conversationId.trim()) {
      throw new Error('Conversation ID must not be empty.');
    }
  }

  /**
   * Validates the state before persistence.
   */
  private validateState(state: ConversationState): void {
    this.validateConversationId(state.conversationId);

    if (
      state.activeProductReference !== null &&
      (typeof state.activeProductReference !== 'string' ||
        !state.activeProductReference.trim())
    ) {
      throw new Error('Active product reference must be null or non-empty.');
    }

    if (
      !(state.updatedAt instanceof Date) ||
      Number.isNaN(state.updatedAt.getTime())
    ) {
      throw new Error('State update timestamp must be a valid date.');
    }
  }

  /**
   * Creates or replaces the state of a conversation.
   */
  async save(state: ConversationState): Promise<void> {
    this.validateState(state);

    const key = this.getKey(state.conversationId);
    const serializedState = JSON.stringify(state);

    await this.redisService.set(key, serializedState, this.ttlSeconds);
  }

  /**
   * Retrieves the current state and restores its Date instance.
   */
  async findByConversationId(
    conversationId: string,
  ): Promise<ConversationState | null> {
    this.validateConversationId(conversationId);

    const serializedState = await this.redisService.get(
      this.getKey(conversationId),
    );

    if (!serializedState) {
      return null;
    }

    let parsedState: unknown;

    try {
      parsedState = JSON.parse(serializedState);
    } catch {
      throw new Error('Stored conversation state contains invalid JSON.');
    }

    if (
      typeof parsedState !== 'object' ||
      parsedState === null ||
      !('conversationId' in parsedState) ||
      !('activeProductReference' in parsedState) ||
      !('updatedAt' in parsedState)
    ) {
      throw new Error('Stored conversation state has an invalid structure.');
    }

    const state = parsedState as {
      conversationId: unknown;
      activeProductReference: unknown;
      updatedAt: unknown;
    };

    const restoredState: ConversationState = {
      conversationId: String(state.conversationId),
      activeProductReference:
        state.activeProductReference === null
          ? null
          : String(state.activeProductReference),
      updatedAt: new Date(String(state.updatedAt)),
    };

    this.validateState(restoredState);

    if (restoredState.conversationId !== conversationId) {
      throw new Error(
        'Stored conversation state belongs to another conversation.',
      );
    }

    return restoredState;
  }

  /**
   * Deletes the state associated with a conversation.
   */
  async delete(conversationId: string): Promise<void> {
    this.validateConversationId(conversationId);

    await this.redisService.del(this.getKey(conversationId));
  }
}
