import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { ProductService } from 'src/modules/products/services/product.service';

@Injectable()
export class SupportChatService {
  private readonly ai: OpenAI;
  private readonly logger = new Logger(SupportChatService.name);

  constructor(private readonly productService: ProductService) {
    this.ai = new OpenAI({
      apiKey: 'lm-studio',
      baseURL: 'http://127.0.0.1:5001/v1',
    });
  }

  async sendMessage(message: string): Promise<{ reply: string }> {
    this.logger.log('Support chat request received');

    try {
      const products = await this.productService.searchForSupportChat(message);

      const productContext = products.length
        ? JSON.stringify(
            products.map((product) => ({
              id: product.id,
              title: product.title,
              description: product.description,
              price: product.price,
              originalPrice: product.originalPrice,
              productType: product.productType,
              weight: product.weight,
              caffeineLevel: product.caffeineLevel,
              flavorNotes: product.flavorNotes,
              originCountry: product.originCountry,
              ingredients: product.ingredients,
              benefits: product.benefits,
              howToUse: product.howToUse,
            })),
            null,
            2,
          )
        : 'No matching active products were found in the database.';

      const response = await this.ai.chat.completions.create({
        model: 'qwen2.5-1.5b-instruct',
        messages: [
          {
            role: 'system',
            content: [
              'You are the customer support assistant for a coffee marketplace.',
              'Answer in the same language as the user whenever possible.',
              'Use the provided product data when answering product-related questions.',
              'Never invent products, prices, ingredients, or product specifications.',
              'If no matching products are provided, clearly say that you could not find matching products in the available catalog.',
              'Do not claim access to live inventory, orders, payments, or private customer information.',
              'Do not invent store policies or order status.',
              'If a question requires information you do not have, clearly explain that limitation.',
            ].join(' '),
          },
          {
            role: 'user',
            content: `
Customer message:
${message}

Available product data:
${productContext}
            `.trim(),
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
