import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class SupportChatService {
  private readonly genAI: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('gemini.apiKey');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    this.genAI = new GoogleGenAI({ apiKey });
  }

  async sendMessage(message: string): Promise<{ reply: string }> {
    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: message,
        config: {
          systemInstruction: [
            'You are the customer support assistant for a coffee marketplace.',
            'Answer in the same language as the user whenever possible.',
            'Help with general questions about coffee products, shopping,',
            'and store policies.',
            'Do not claim access to live inventory, orders, payments,',
            'or private customer information.',
            'Do not invent store policies, product details, or order status.',
            'If a question requires information you do not have,',
            'clearly explain that limitation.',
          ].join(' '),
        },
      });

      const reply = response.text?.trim();

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

      // Keep provider details and API credentials out of client responses.
      throw new ServiceUnavailableException(
        'The support chatbot is temporarily unavailable. Please try again later.',
      );
    }
  }
}
