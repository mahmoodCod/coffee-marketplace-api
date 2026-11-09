import { Inject, Injectable, Logger } from '@nestjs/common';
import type Redis from 'ioredis';

import { REDIS_CLIENT } from './redis.constants';

/**
 * ------------------------------------------------------------------------
 * Redis Service
 * ------------------------------------------------------------------------
 *
 * Thin wrapper around the shared ioredis client.
 *
 * Responsibilities
 * ------------------------------------------------------------------------
 * - Read and write string values.
 * - Apply key expiration.
 * - Disconnect cleanly on application shutdown.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
      return;
    }

    await this.redis.set(key, value);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

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
