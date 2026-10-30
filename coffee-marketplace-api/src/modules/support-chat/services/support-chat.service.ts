import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class SupportChatService {
  private readonly ai: OpenAI;
  private readonly logger = new Logger(SupportChatService.name);

  constructor() {
    this.ai = new OpenAI({
      apiKey: 'lm-studio',
      baseURL: 'http://127.0.0.1:5001/v1',
    });
  }

  async sendMessage(message: string): Promise<{ reply: string }> {
    this.logger.log('Support chat request received');

    try {
      const response = await this.ai.chat.completions.create({
        model: 'qwen2.5-1.5b-instruct',
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

      this.logger.error(`Local AI request failed: ${errorMessage}`);

      throw new ServiceUnavailableException(
        'The support chatbot is temporarily unavailable. Please try again later.',
      );
    }
  }
}
