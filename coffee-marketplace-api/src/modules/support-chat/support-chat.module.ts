import { Module } from '@nestjs/common';
import { SupportChatController } from './controllers/support-chat.controller';
import { SupportChatService } from './services/support-chat.service';
import { SupportChatHistoryService } from './services/support-chat-history.service';
import { ProductModule } from '../products/products.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProductModule, AuthModule],
  controllers: [SupportChatController],
  providers: [SupportChatService, SupportChatHistoryService],
})
export class SupportChatModule {}
