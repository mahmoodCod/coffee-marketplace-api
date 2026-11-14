import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';

import { REDIS_CLIENT } from './redis.constants';

/**
 * Shared Redis service.
 *
 * Provides the Redis operations required by application modules
 * without exposing the Redis client directly.
 */
@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /**
   * Retrieves a string value.
   */
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  /**
   * Stores a string value with an optional expiration time.
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined && ttlSeconds > 0) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
      return;
    }

    await this.redis.set(key, value);
  }

  /**
   * Deletes one or more Redis keys.
   */
  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }

    return this.redis.del(...keys);
  }

  /**
   * Updates the expiration time of an existing key.
   */
  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
      throw new Error('TTL must be a positive safe integer.');
    }

    return (await this.redis.expire(key, ttlSeconds)) === 1;
  }

  /**
   * Appends a value to a Redis list.
   */
  async rpush(key: string, value: string): Promise<number> {
    return this.redis.rpush(key, value);
  }

  /**
   * Retrieves a range of values from a Redis list.
   */
  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.lrange(key, start, stop);
  }

  /**
   * Executes a Lua script atomically.
   */
  async eval(
    script: string,
    numberOfKeys: number,
    ...args: (string | number)[]
  ): Promise<unknown> {
    return this.redis.eval(script, numberOfKeys, ...args);
  }

  /**
   * Executes a Redis MULTI transaction.
   */
  multi(): ReturnType<Redis['multi']> {
    return this.redis.multi();
  }

  /**
   * Checks whether Redis is reachable.
   */
  async ping(): Promise<string> {
    return this.redis.ping();
  }

  /**
   * Closes the Redis connection during application shutdown.
   */
  async quit(): Promise<void> {
    try {
      await this.redis.quit();
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.warn(`Failed to close Redis connection: ${errorMessage}`);
    }
  }
}
