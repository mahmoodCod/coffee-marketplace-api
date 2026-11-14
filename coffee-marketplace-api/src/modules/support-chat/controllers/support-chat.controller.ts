import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { OptionalAuth } from 'src/common/decorators/optional-auth.decorator';
import { OptionalCurrentUser } from 'src/common/decorators/optional-current-user.decorator';

import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

import { SupportChatService } from '../services/support-chat.service';
import { ChatMessageDto } from '../dto/chat-message.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

@ApiTags('Support Chat')
@Controller('support-chat')
@UseGuards(JwtAuthGuard)
export class SupportChatController {
  constructor(private readonly supportChatService: SupportChatService) {}

  @OptionalAuth()
  @Post()
  @ApiOperation({
    summary: 'Send a message to the AI support chatbot',
    description:
      'Answers general questions about coffee products, shopping, and store policies. ' +
      'Supports both guest and authenticated users. ' +
      'Conversation history is kept in Redis when a sessionId is reused.',
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
    status: 401,
    description: 'The provided access token is invalid or expired.',
  })
  @ApiResponse({
    status: 503,
    description: 'The AI service is temporarily unavailable.',
  })
  async sendMessage(
    @Body() dto: ChatMessageDto,
    @OptionalCurrentUser() user: JwtPayload | null,
  ) {
    return this.supportChatService.sendMessage(
      dto.message,
      dto.sessionId,
      user,
    );
  }
}
