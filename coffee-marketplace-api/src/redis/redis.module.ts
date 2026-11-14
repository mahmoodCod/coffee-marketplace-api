import { Global, Logger, Module, OnApplicationShutdown } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('Redis');
        const redis = new Redis({
          host: configService.getOrThrow<string>('redis.host'),
          port: configService.getOrThrow<number>('redis.port'),
          maxRetriesPerRequest: 1,
          enableReadyCheck: true,
          lazyConnect: true,
          retryStrategy: () => null,
        });

        /**
         * ioredis emits connection failures as events.
         * Without a listener, a stopped Redis server crashes the API.
         */
        redis.on('error', (error: Error) => {
          logger.warn(`Redis connection error: ${error.message}`);
        });

        return redis;
      },
    },
    RedisService,
  ],
  exports: [REDIS_CLIENT, RedisService],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(private readonly redisService: RedisService) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redisService.quit();
  }
}
