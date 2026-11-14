import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';

import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { OptionalAuth } from 'src/common/decorators/optional-auth.decorator';
import { OptionalCurrentUser } from 'src/common/decorators/optional-current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';

import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

import { ChatMessageDto } from '../dto/chat-message.dto';
import { SupportChatService } from '../services/support-chat.service';

import {
  SUPPORT_CHAT_GUEST_COOKIE_NAME,
  SUPPORT_CHAT_GUEST_IDENTITY_TTL_SECONDS,
} from '../constants/support-chat-history.constants';

/**
 * ------------------------------------------------------------------------
 * Support Chat Controller
 * ------------------------------------------------------------------------
 *
 * Handles HTTP requests for the support chatbot.
 *
 * Responsibilities:
 * - Accept guest and authenticated customer messages.
 * - Read guest identity from an HTTP-only cookie.
 * - Pass conversation ownership information to the service.
 * - Set the guest identity cookie when necessary.
 * ------------------------------------------------------------------------
 */
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
      'Answers questions about coffee products, shopping, and store policies. ' +
      'Supports both guest and authenticated users. ' +
      'An existing conversation can be continued using conversationId. ' +
      'Guest identity is maintained using an HTTP-only cookie.',
  })
  @ApiResponse({
    status: 201,
    description: 'The chatbot generated a response.',
  })
  @ApiResponse({
    status: 400,
    description: 'The message or conversation identifier is invalid.',
  })
  @ApiResponse({
    status: 401,
    description: 'The provided access token is invalid or expired.',
  })
  @ApiResponse({
    status: 403,
    description: 'The conversation does not belong to the requester.',
  })
  @ApiResponse({
    status: 503,
    description: 'The AI service is temporarily unavailable.',
  })
  async sendMessage(
    @Body() dto: ChatMessageDto,
    @OptionalCurrentUser() user: JwtPayload | null,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Authenticated customers use their account identity instead of guest cookies.
    const guestToken = user
      ? undefined
      : request.cookies?.[SUPPORT_CHAT_GUEST_COOKIE_NAME];

    const result = await this.supportChatService.sendMessage(
      dto.message,
      dto.conversationId,
      user,
      guestToken,
    );

    // Never expose the raw guest token in the JSON response.
    if (result.guestToken) {
      response.cookie(SUPPORT_CHAT_GUEST_COOKIE_NAME, result.guestToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/support-chat',
        maxAge: SUPPORT_CHAT_GUEST_IDENTITY_TTL_SECONDS * 1000,
      });
    }

    return {
      reply: result.reply,
      conversationId: result.conversationId,
    };
  }
}
