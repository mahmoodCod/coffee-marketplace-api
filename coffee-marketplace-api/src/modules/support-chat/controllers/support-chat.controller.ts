import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/common/decorators/public.decorator';
import { SupportChatService } from '../services/support-chat.service';
import { ChatMessageDto } from '../dto/chat-message.dto';

@ApiTags('Support Chat')
@Controller('support-chat')
export class SupportChatController {
  constructor(private readonly supportChatService: SupportChatService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary: 'Send a message to the AI support chatbot',
    description:
      'Answers general questions about coffee products, shopping, and store policies.',
  })
  @ApiResponse({
    status: 201,
    description: 'The chatbot generated a response.',
  })
  @ApiResponse({
    status: 400,
    description: 'The message is invalid.',
  })
  @ApiResponse({
    status: 503,
    description: 'The AI service is temporarily unavailable.',
  })
  async sendMessage(@Body() dto: ChatMessageDto) {
    return this.supportChatService.sendMessage(dto.message);
  }
}
