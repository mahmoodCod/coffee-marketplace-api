import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import OpenAI from 'openai';
import { Product } from 'src/modules/products/entities/product.entity';
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
      const normalizedMessage = message.trim().toLowerCase();

      const isCatalogQuestion =
        /^(آیا )?(محصولات|کالاهای) (این )?(فروشگاه )?(را )?(دارید|موجود است|موجود هستند)\??$|^(چه )?(محصولات|کالاهایی) (در این فروشگاه )?(دارید|موجود است)\??$|^(لیست|فهرست) محصولات( فروشگاه)?\??$|^آیا محصولی (در این فروشگاه|داخل این فروشگاه) هست\??$/.test(
          normalizedMessage,
        );

      let products: Product[] = [];

      if (isCatalogQuestion) {
        products = await this.productService.findAll();

        if (products.length === 0) {
          return {
            reply:
              'در حال حاضر هنوز محصولی در فروشگاه ثبت نشده است. ' +
              'به‌محض اضافه شدن محصولات، می‌توانید آن‌ها را در اینجا مشاهده کنید. ' +
              'اگر درباره انواع قهوه، تفاوت دانه‌ها یا روش‌های دم‌آوری سؤالی دارید، خوشحال می‌شوم راهنمایی‌تان کنم.',
          };
        }
      } else {
        products = await this.productService.searchForSupportChat(message);
      }

      const productContext =
        products.length > 0
          ? JSON.stringify(
              products.slice(0, 10).map((product) => ({
                title: product.title,
                description: product.description,
                price: Number(product.price),
                originalPrice: product.originalPrice
                  ? Number(product.originalPrice)
                  : null,
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
          : 'No matching products were found in the catalog.';

      const response = await this.ai.chat.completions.create({
        model: 'qwen3-4b-instruct-2507',
        messages: [
          {
            role: 'system',
            content: [
              'You are a helpful and professional customer support assistant for a coffee marketplace.',
              'Always answer in the same language as the customer.',
              'Be friendly, clear, accurate, and helpful.',
              'Give complete but concise answers.',
              'Use the provided product data for product-related questions.',
              'Never invent products, prices, ingredients, or specifications.',
              'If no matching products are provided, clearly explain that no matching product was found.',
              'You can answer general educational questions about coffee using your general knowledge.',
              'Do not claim access to live inventory, orders, payments, or private customer information.',
              'Never invent store policies or order status.',
              'If you do not know something, say so honestly.',
            ].join(' '),
          },
          {
            role: 'user',
            content: `
Customer question:
${message}

Available product information:
${productContext}

Please answer the customer naturally and accurately.
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
