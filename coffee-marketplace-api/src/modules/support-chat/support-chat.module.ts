import { Module } from '@nestjs/common';
import { SupportChatController } from './controllers/support-chat.controller';
import { SupportChatService } from './services/support-chat.service';
import { ProductModule } from '../products/products.module';

@Module({
  imports: [ProductModule],
  controllers: [SupportChatController],
  providers: [SupportChatService],
})
export class SupportChatModule {}
