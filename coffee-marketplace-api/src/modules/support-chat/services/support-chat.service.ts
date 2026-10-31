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
        products = await this.productService.findAllForSupportChat();

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
              products.slice(0, 10).map((product) => {
                const inventory = product.inventory;

                const availableStock = inventory
                  ? inventory.stock - inventory.reservedStock
                  : null;

                return {
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
                  stock: inventory?.stock ?? null,
                  reservedStock: inventory?.reservedStock ?? null,
                  availableStock,
                  availability:
                    availableStock === null
                      ? 'وضعیت موجودی نامشخص است'
                      : availableStock > 0
                        ? 'موجود'
                        : 'ناموجود',
                };
              }),
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
              'When the customer asks about the store catalog, list all provided active products, including out-of-stock products.',
              'For each product, clearly state its availability and available stock when that information is provided.',
              'Available stock is the stock quantity minus the reserved stock quantity.',
              'Never describe a product as available when its available stock is zero.',
              'If inventory information is missing, say that the availability is unknown.',
              'Never invent or estimate stock quantities.',
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
