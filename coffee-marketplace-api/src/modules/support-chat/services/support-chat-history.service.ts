import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from 'src/redis';

import {
  SUPPORT_CHAT_HISTORY_KEY_PREFIX,
  SUPPORT_CHAT_HISTORY_MAX_MESSAGES,
  SUPPORT_CHAT_HISTORY_TTL_SECONDS,
} from '../constants/support-chat-history.constants';
import { SupportChatHistoryMessage } from '../interfaces/support-chat-history.interface';

/**
 * ------------------------------------------------------------------------
 * Support Chat History Service
 * ------------------------------------------------------------------------
 *
 * Persists short-lived support chat conversations in Redis.
 *
 * Responsibilities
 * ------------------------------------------------------------------------
 * - Load previous messages for a conversation session.
 * - Append new customer and assistant messages.
 * - Limit history size and refresh expiration on each turn.
 *
 * Business Rules
 * ------------------------------------------------------------------------
 * - History is scoped by sessionId.
 * - Only the newest messages are kept.
 * - Redis failures must not crash the chatbot response flow.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class SupportChatHistoryService {
  private readonly logger = new Logger(SupportChatHistoryService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Builds the Redis key for one support chat session.
   */
  private buildKey(sessionId: string): string {
    return `${SUPPORT_CHAT_HISTORY_KEY_PREFIX}${sessionId}`;
  }

  /**
   * Loads conversation history for the given session.
   *
   * Returns an empty list when the session is new or Redis is unavailable.
   */
  async getHistory(sessionId: string): Promise<SupportChatHistoryMessage[]> {
    try {
      const rawHistory = await this.redisService.get(this.buildKey(sessionId));

      if (!rawHistory) {
        return [];
      }

      const parsedHistory = JSON.parse(rawHistory) as SupportChatHistoryMessage[];

      if (!Array.isArray(parsedHistory)) {
        return [];
      }

      return parsedHistory.filter(
        (message) =>
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string' &&
          message.content.trim().length > 0,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.warn(
        `Failed to load support chat history for session ${sessionId}: ${errorMessage}`,
      );

      return [];
    }
  }

  /**
   * Appends customer and assistant messages to the session history.
   *
   * Older messages are trimmed so the AI context stays bounded.
   */
  async appendTurn(
    sessionId: string,
    customerMessage: string,
    assistantMessage: string,
  ): Promise<void> {
    try {
      const history = await this.getHistory(sessionId);

      history.push(
        {
          role: 'user',
          content: customerMessage,
        },
        {
          role: 'assistant',
          content: assistantMessage,
        },
      );

      const trimmedHistory = history.slice(-SUPPORT_CHAT_HISTORY_MAX_MESSAGES);

      await this.redisService.set(
        this.buildKey(sessionId),
        JSON.stringify(trimmedHistory),
        SUPPORT_CHAT_HISTORY_TTL_SECONDS,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.warn(
        `Failed to save support chat history for session ${sessionId}: ${errorMessage}`,
      );
    }
  }
}
