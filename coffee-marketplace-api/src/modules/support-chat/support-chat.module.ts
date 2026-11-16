import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SupportChatController } from './controllers/support-chat.controller';
import { SupportChatService } from './services/support-chat.service';
import { SupportChatHistoryService } from './services/support-chat-history.service';

import { ProductModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';

import { SUPPORT_CHAT_TOKENS } from './constants/support-chat.tokens';

// Application use cases
import { ConversationHistoryUseCase } from './domain/application/use-cases/conversation-history.use-case';
import { ConversationLifecycleUseCase } from './domain/application/use-cases/conversation-lifecycle.use-case';
import { ConversationStateUseCase } from './domain/application/use-cases/conversation-state.use-case';
import { GuestIdentityUseCase } from './domain/application/use-cases/guest-identity.use-case';
import { ProductReferenceUseCase } from './domain/application/use-cases/product-reference.use-case';

// PostgreSQL entities
import { ConversationOrmEntity } from './infrastructure/persistence/postgres/conversation.orm-entity';
import { GuestIdentityOrmEntity } from './infrastructure/persistence/postgres/guest-identity.orm-entity';

// PostgreSQL repositories
import { TypeOrmConversationRepository } from './infrastructure/persistence/postgres/typeorm-conversation.repository';
import { TypeOrmGuestIdentityRepository } from './infrastructure/persistence/postgres/typeorm-guest-identity.repository';

// Redis repositories
import { RedisConversationTurnRepository } from './infrastructure/persistence/redis/redis-conversation-turn.repository';
import { RedisConversationStateRepository } from './infrastructure/persistence/redis/redis-conversation-state.repository';
import { RedisProductReferenceRepository } from './infrastructure/persistence/redis/redis-product-reference.repository';
import { ToolRegistryService } from './tools/tool-registry.service';

@Module({
  imports: [
    ProductModule,
    AuthModule,

    // Register PostgreSQL entities for repository injection.
    TypeOrmModule.forFeature([ConversationOrmEntity, GuestIdentityOrmEntity]),
  ],
  controllers: [SupportChatController],
  providers: [
    SupportChatService,
    SupportChatHistoryService,
    ToolRegistryService,

    // Register application use cases.
    ConversationHistoryUseCase,
    ConversationLifecycleUseCase,
    ConversationStateUseCase,
    GuestIdentityUseCase,
    ProductReferenceUseCase,

    // PostgreSQL repository bindings.
    {
      provide: SUPPORT_CHAT_TOKENS.CONVERSATION_REPOSITORY,
      useClass: TypeOrmConversationRepository,
    },
    {
      provide: SUPPORT_CHAT_TOKENS.GUEST_IDENTITY_REPOSITORY,
      useClass: TypeOrmGuestIdentityRepository,
    },

    // Redis repository bindings.
    {
      provide: SUPPORT_CHAT_TOKENS.CONVERSATION_TURN_REPOSITORY,
      useClass: RedisConversationTurnRepository,
    },
    {
      provide: SUPPORT_CHAT_TOKENS.CONVERSATION_STATE_REPOSITORY,
      useClass: RedisConversationStateRepository,
    },
    {
      provide: SUPPORT_CHAT_TOKENS.PRODUCT_REFERENCE_REPOSITORY,
      useClass: RedisProductReferenceRepository,
    },
  ],
  exports: [
    SUPPORT_CHAT_TOKENS.CONVERSATION_REPOSITORY,
    SUPPORT_CHAT_TOKENS.GUEST_IDENTITY_REPOSITORY,
    SUPPORT_CHAT_TOKENS.CONVERSATION_TURN_REPOSITORY,
    SUPPORT_CHAT_TOKENS.CONVERSATION_STATE_REPOSITORY,
    SUPPORT_CHAT_TOKENS.PRODUCT_REFERENCE_REPOSITORY,

    // Export use cases for other modules when needed.
    ConversationHistoryUseCase,
    ConversationLifecycleUseCase,
    ConversationStateUseCase,
    GuestIdentityUseCase,
    ProductReferenceUseCase,
  ],
})
export class SupportChatModule {}
