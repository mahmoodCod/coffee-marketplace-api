import { Injectable, Logger } from '@nestjs/common';

import { RedisService } from 'src/redis';

import {
  SUPPORT_CHAT_HISTORY_KEY_PREFIX,
  SUPPORT_CHAT_HISTORY_MAX_MESSAGES,
  SUPPORT_CHAT_HISTORY_TTL_SECONDS,
  SUPPORT_CHAT_PRODUCT_CONTEXT_KEY_PREFIX,
  SUPPORT_CHAT_SELECTED_PRODUCT_KEY_PREFIX,
} from '../constants/support-chat-history.constants';
import { SupportChatHistoryMessage } from '../interfaces/support-chat-history.interface';

/**
 * ------------------------------------------------------------------------
 * Support Chat History Service
 * ------------------------------------------------------------------------
 *
 * Persists short-lived support chat conversations and product context in Redis.
 *
 * Responsibilities
 * ------------------------------------------------------------------------
 * - Load previous messages for a conversation session.
 * - Append new customer and assistant messages.
 * - Store product IDs referenced during the conversation.
 * - Retrieve previously referenced product IDs.
 * - Limit history size and refresh expiration on each update.
 *
 * Business Rules
 * ------------------------------------------------------------------------
 * - History and product context are scoped by sessionId.
 * - Only the newest messages are kept.
 * - Product IDs are stored separately from conversation messages.
 * - Redis failures must not crash the chatbot response flow.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class SupportChatHistoryService {
  private readonly logger = new Logger(SupportChatHistoryService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Builds the Redis key for conversation history.
   */
  private buildKey(sessionId: string): string {
    return `${SUPPORT_CHAT_HISTORY_KEY_PREFIX}${sessionId}`;
  }

  /**
   * Builds the Redis key for referenced product IDs.
   */
  private buildProductContextKey(sessionId: string): string {
    return `${SUPPORT_CHAT_PRODUCT_CONTEXT_KEY_PREFIX}${sessionId}`;
  }

  /**
   * Builds the Redis key for the selected product.
   */
  private buildSelectedProductKey(sessionId: string): string {
    return `${SUPPORT_CHAT_SELECTED_PRODUCT_KEY_PREFIX}${sessionId}`;
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

      const parsedHistory = JSON.parse(
        rawHistory,
      ) as SupportChatHistoryMessage[];

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

  /**
   * Retrieves product IDs previously referenced in a conversation.
   *
   * Invalid values are ignored to prevent corrupted Redis data from
   * reaching product retrieval queries.
   */
  async getReferencedProductIds(sessionId: string): Promise<string[]> {
    try {
      const rawProductIds = await this.redisService.get(
        this.buildProductContextKey(sessionId),
      );

      if (!rawProductIds) {
        return [];
      }

      const parsedProductIds: unknown = JSON.parse(rawProductIds);

      if (!Array.isArray(parsedProductIds)) {
        return [];
      }

      const productIds = parsedProductIds.filter((productId) =>
        this.isValidProductId(productId),
      );

      return [...new Set(productIds)];
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.warn(
        `Failed to load referenced product IDs for session ${sessionId}: ${errorMessage}`,
      );

      return [];
    }
  }

  /**
   * Saves product IDs referenced during the conversation.
   *
   * The provided IDs replace the previous product context.
   * An empty array clears the stored product context.
   */
  async saveReferencedProductIds(
    sessionId: string,
    productIds: string[],
  ): Promise<void> {
    try {
      const validProductIds = [
        ...new Set(
          productIds.filter((productId) => this.isValidProductId(productId)),
        ),
      ];

      await this.redisService.set(
        this.buildProductContextKey(sessionId),
        JSON.stringify(validProductIds),
        SUPPORT_CHAT_HISTORY_TTL_SECONDS,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.warn(
        `Failed to save referenced product IDs for session ${sessionId}: ${errorMessage}`,
      );
    }
  }

  /**
   * Validates whether a value is a UUID product identifier.
   */
  private isValidProductId(productId: unknown): productId is string {
    return (
      typeof productId === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        productId,
      )
    );
  }

  /**
   * Retrieves the selected product ID for a conversation.
   *
   * Returns null when no product is selected or the stored value is invalid.
   */
  async getSelectedProductId(sessionId: string): Promise<string | null> {
    try {
      const rawProductId = await this.redisService.get(
        this.buildSelectedProductKey(sessionId),
      );

      if (!rawProductId) {
        return null;
      }

      const parsedProductId: unknown = JSON.parse(rawProductId);

      return this.isValidProductId(parsedProductId) ? parsedProductId : null;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.warn(
        `Failed to load selected product ID for session ${sessionId}: ${errorMessage}`,
      );

      return null;
    }
  }

  /**
   * Saves or clears the selected product ID for a conversation.
   *
   * Passing null clears the current selection.
   */
  async saveSelectedProductId(
    sessionId: string,
    productId: string | null,
  ): Promise<void> {
    try {
      const validProductId =
        productId !== null && this.isValidProductId(productId)
          ? productId
          : null;

      await this.redisService.set(
        this.buildSelectedProductKey(sessionId),
        JSON.stringify(validProductId),
        SUPPORT_CHAT_HISTORY_TTL_SECONDS,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.warn(
        `Failed to save selected product ID for session ${sessionId}: ${errorMessage}`,
      );
    }
  }
}
