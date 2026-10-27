import { Module } from '@nestjs/common';
import { SupportChatController } from './controllers/support-chat.controller';
import { SupportChatService } from './services/support-chat.service';

@Module({
  controllers: [SupportChatController],
  providers: [SupportChatService],
})
export class SupportChatModule {}
