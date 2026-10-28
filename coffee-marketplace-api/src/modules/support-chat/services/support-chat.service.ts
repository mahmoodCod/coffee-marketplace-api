import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class SupportChatService {
  private readonly deepSeek: OpenAI;
  private readonly logger = new Logger(SupportChatService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('DEEPSEEK_API_KEY');

    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured.');
    }

    this.deepSeek = new OpenAI({
      apiKey,
      baseURL: 'https://api.deepseek.com',
    });
  }

  async sendMessage(message: string): Promise<{ reply: string }> {
    this.logger.log('Support chat request received');

    try {
      const response = await this.deepSeek.chat.completions.create({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: [
              'You are the customer support assistant for a coffee marketplace.',
              'Answer in the same language as the user whenever possible.',
              'Help with general questions about coffee products, shopping, and store policies.',
              'Do not claim access to live inventory, orders, payments, or private customer information.',
              'Do not invent store policies, product details, or order status.',
              'If a question requires information you do not have, clearly explain that limitation.',
            ].join(' '),
          },
          {
            role: 'user',
            content: message,
          },
        ],
      });

      const reply = response.choices[0]?.message?.content?.trim();

      if (!reply) {
        throw new ServiceUnavailableException(
          'The AI service returned an empty response.',
        );
      }

      return { reply };
    } catch (error: unknown) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error(`DeepSeek API request failed: ${errorMessage}`);

      throw new ServiceUnavailableException(
        'The support chatbot is temporarily unavailable. Please try again later.',
      );
    }
  }
}
