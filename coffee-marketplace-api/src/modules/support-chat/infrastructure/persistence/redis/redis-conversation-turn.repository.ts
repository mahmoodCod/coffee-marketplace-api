import { Injectable } from '@nestjs/common';

import { RedisService } from '../../../../../redis/redis.service';

import type { ConversationTurnRepository } from '../../../domain/repositories/conversation-turn.repository';
import type { ConversationTurn } from '../../../domain/models/conversation-message.model';

const DEFAULT_TTL_SECONDS = 24 * 60 * 60;

/**
 * Stores conversation turns in Redis.
 *
 * Each turn is stored as one JSON document to preserve
 * the relationship between assistant tool calls and results.
 */
@Injectable()
export class RedisConversationTurnRepository implements ConversationTurnRepository {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Builds Redis keys using a conversation hash tag.
   */
  private getKeys(conversationId: string) {
    const prefix = `support-chat:{${conversationId}}:turns`;

    return {
      list: `${prefix}:list`,
      sequence: `${prefix}:sequence`,
      requests: `${prefix}:requests`,
      request: (requestId: string) => `${prefix}:request:${requestId}`,
    };
  }

  /**
   * Validates the conversation identifier.
   */
  private validateConversationId(conversationId: string): void {
    if (
      typeof conversationId !== 'string' ||
      conversationId.trim().length === 0
    ) {
      throw new Error('Conversation ID is required.');
    }
  }

  /**
   * Validates a conversation turn before persistence.
   */
  private validateTurn(turn: ConversationTurn): void {
    if (!turn || typeof turn !== 'object') {
      throw new Error('A valid conversation turn is required.');
    }

    if (
      typeof turn.requestId !== 'string' ||
      turn.requestId.trim().length === 0
    ) {
      throw new Error('Request ID is required.');
    }

    if (!Number.isSafeInteger(turn.sequence) || turn.sequence <= 0) {
      throw new Error('Turn sequence must be a positive safe integer.');
    }

    if (!Array.isArray(turn.messages) || turn.messages.length === 0) {
      throw new Error('A conversation turn must contain messages.');
    }

    if (
      !(turn.createdAt instanceof Date) ||
      Number.isNaN(turn.createdAt.getTime())
    ) {
      throw new Error('Turn creation date is invalid.');
    }

    for (const message of turn.messages) {
      if (message.conversationId === undefined) {
        throw new Error('Message conversation ID is required.');
      }

      if (
        message.conversationId === '' ||
        message.conversationId === undefined
      ) {
        throw new Error('Message conversation ID is invalid.');
      }

      if (
        !(message.createdAt instanceof Date) ||
        Number.isNaN(message.createdAt.getTime())
      ) {
        throw new Error('Message creation date is invalid.');
      }
    }
  }

  /**
   * Atomically appends a turn and prevents duplicate request IDs.
   *
   * The script also verifies the expected sequence number.
   */
  async append(
    conversationId: string,
    turn: ConversationTurn,
  ): Promise<boolean> {
    this.validateConversationId(conversationId);
    this.validateTurn(turn);

    if (
      turn.messages.some((message) => message.conversationId !== conversationId)
    ) {
      throw new Error('All messages must belong to the target conversation.');
    }

    const keys = this.getKeys(conversationId);

    const script = `
      local listKey = KEYS[1]
      local sequenceKey = KEYS[2]
      local requestsKey = KEYS[3]
      local requestKey = KEYS[4]

      local requestId = ARGV[1]
      local sequence = tonumber(ARGV[2])
      local payload = ARGV[3]
      local ttl = tonumber(ARGV[4])

      if redis.call('EXISTS', requestKey) == 1 then
        return 0
      end

      if redis.call('SISMEMBER', requestsKey, requestId) == 1 then
        return 0
      end

      local currentSequence = tonumber(redis.call('GET', sequenceKey) or '0')

      if sequence ~= currentSequence + 1 then
        return -1
      end

      redis.call('RPUSH', listKey, payload)
      redis.call('SET', sequenceKey, sequence, 'EX', ttl)
      redis.call('SADD', requestsKey, requestId)
      redis.call('SET', requestKey, payload, 'EX', ttl)

      redis.call('EXPIRE', listKey, ttl)
      redis.call('EXPIRE', requestsKey, ttl)

      return 1
    `;

    const result = await this.redisService.eval(
      script,
      4,
      keys.list,
      keys.sequence,
      keys.requests,
      keys.request(turn.requestId),
      turn.requestId,
      turn.sequence,
      JSON.stringify(turn),
      DEFAULT_TTL_SECONDS,
    );

    if (result === 1) {
      return true;
    }

    if (result === 0) {
      return false;
    }

    if (result === -1) {
      throw new Error('Invalid conversation turn sequence.');
    }

    throw new Error('Unexpected Redis append result.');
  }

  /**
   * Retrieves the most recent turns in chronological order.
   */
  async findRecent(
    conversationId: string,
    limit: number,
  ): Promise<ConversationTurn[]> {
    this.validateConversationId(conversationId);

    if (!Number.isSafeInteger(limit) || limit <= 0) {
      throw new Error('History limit must be a positive safe integer.');
    }

    const { list } = this.getKeys(conversationId);

    const values = await this.redisService.lrange(list, -limit, -1);

    return values.map((value) => this.deserializeTurn(value));
  }

  /**
   * Retrieves a turn using its request ID.
   */
  async findByRequestId(
    conversationId: string,
    requestId: string,
  ): Promise<ConversationTurn | null> {
    this.validateConversationId(conversationId);

    if (typeof requestId !== 'string' || requestId.trim().length === 0) {
      throw new Error('Request ID is required.');
    }

    const keys = this.getKeys(conversationId);
    const value = await this.redisService.get(keys.request(requestId));

    return value ? this.deserializeTurn(value) : null;
  }

  /**
   * Deletes all conversation history and associated idempotency keys.
   *
   * The operation is atomic to prevent partially deleted history.
   */
  async deleteAll(conversationId: string): Promise<void> {
    this.validateConversationId(conversationId);

    const keys = this.getKeys(conversationId);

    const script = `
      local requestIds = redis.call('SMEMBERS', KEYS[3])

      for _, requestId in ipairs(requestIds) do
        redis.call('DEL', ARGV[1] .. requestId)
      end

      redis.call('DEL', KEYS[1], KEYS[2], KEYS[3])

      return #requestIds
    `;

    await this.redisService.eval(
      script,
      3,
      keys.list,
      keys.sequence,
      keys.requests,
      keys.request(''),
    );
  }

  /**
   * Restores Date instances after reading JSON from Redis.
   */
  private deserializeTurn(value: string): ConversationTurn {
    const parsed: unknown = JSON.parse(value);

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Stored conversation turn is invalid.');
    }

    const turn = parsed as ConversationTurn;

    return {
      ...turn,
      createdAt: new Date(turn.createdAt),
      messages: turn.messages.map((message) => ({
        ...message,
        createdAt: new Date(message.createdAt),
      })),
    };
  }
}
