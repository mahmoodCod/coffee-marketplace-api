import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

import OpenAI from 'openai';

import { Product } from 'src/modules/products/entities/product.entity';
import { ProductService } from 'src/modules/products/services/product.service';

/**
 * ------------------------------------------------------------------------
 * Support Chat Service
 * ------------------------------------------------------------------------
 *
 * Handles customer support conversations using a local AI model.
 *
 * Responsibilities
 * ------------------------------------------------------------------------
 *
 * - Receive customer messages.
 * - Detect product catalog questions.
 * - Retrieve relevant products from the database.
 * - Retrieve product inventory information.
 * - Build product context for the AI model.
 * - Generate customer support responses.
 * - Handle AI service errors.
 *
 * AI Integration
 * ------------------------------------------------------------------------
 *
 * - Local AI server: LM Studio
 * - Model: Qwen3 4B Instruct
 * - API compatibility: OpenAI-compatible API
 *
 * Business Rules
 * ------------------------------------------------------------------------
 *
 * - Product-related answers must use database information.
 * - Active products are included in catalog responses.
 * - Out-of-stock products must not be excluded from the catalog.
 * - Available stock must exclude reserved quantities.
 * - Missing inventory information must not be treated as zero stock.
 * - The AI must never invent product or inventory information.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class SupportChatService {
  /**
   * Local AI client used to communicate with the LM Studio server.
   */
  private readonly ai: OpenAI;

  /**
   * Logger used to record support chat events and errors.
   */
  private readonly logger = new Logger(SupportChatService.name);

  constructor(private readonly productService: ProductService) {
    /**
     * --------------------------------------------------------------------
     * Initialize Local AI Client
     * --------------------------------------------------------------------
     *
     * Configures the OpenAI SDK to communicate with the local LM Studio
     * server instead of the official OpenAI API.
     *
     * Notes:
     *
     * - The API key is a placeholder for local development.
     * - The base URL points to the local LM Studio server.
     * --------------------------------------------------------------------
     */
    this.ai = new OpenAI({
      apiKey: 'lm-studio',
      baseURL: 'http://127.0.0.1:5001/v1',
    });
  }

  /**
   * ------------------------------------------------------------------------
   * Send Message
   * ------------------------------------------------------------------------
   *
   * Processes a customer message and generates an AI-powered response.
   *
   * Workflow
   * ------------------------------------------------------------------------
   *
   * 1. Normalize the customer message.
   * 2. Detect whether the customer is asking for the product catalog.
   * 3. Retrieve products from the database.
   * 4. Build product and inventory context.
   * 5. Send the context and customer question to the AI model.
   * 6. Return the generated response.
   *
   * Business Rules
   * ------------------------------------------------------------------------
   *
   * - Catalog questions retrieve all active products.
   * - Specific product questions use product search.
   * - Product availability is calculated using inventory data.
   * - Empty AI responses are treated as service errors.
   *
   * @param message Customer's message.
   * @returns AI-generated customer support response.
   * ------------------------------------------------------------------------
   */
  async sendMessage(message: string): Promise<{ reply: string }> {
    /**
     * Log incoming support chat requests.
     */
    this.logger.log('Support chat request received');

    try {
      /**
       * ------------------------------------------------------------------
       * Normalize Customer Message
       * ------------------------------------------------------------------
       *
       * Removes surrounding whitespace and converts the message to
       * lowercase to make catalog question detection more consistent.
       * ------------------------------------------------------------------
       */
      const normalizedMessage = message.trim().toLowerCase();

      /**
       * ------------------------------------------------------------------
       * Detect Product Catalog Questions
       * ------------------------------------------------------------------
       *
       * Determines whether the customer is asking for the complete
       * list of products available in the store.
       *
       * The regular expression supports common Persian expressions
       * such as:
       *
       * - محصولات فروشگاه را دارید؟
       * - چه محصولاتی دارید؟
       * - لیست محصولات
       * - آیا محصولی در این فروشگاه هست؟
       *
       * Catalog questions require retrieving all active products
       * instead of searching for a specific product.
       * ------------------------------------------------------------------
       */
      const isCatalogQuestion =
        /^(آیا )?(محصولات|کالاهای) (این )?(فروشگاه )?(را )?(دارید|موجود است|موجود هستند)\??$|^(چه )?(محصولات|کالاهایی) (در این فروشگاه )?(دارید|موجود است)\??$|^(لیست|فهرست) محصولات( فروشگاه)?\??$|^آیا محصولی (در این فروشگاه|داخل این فروشگاه) هست\??$/.test(
          normalizedMessage,
        );

      /**
       * Stores products retrieved from the database.
       */
      let products: Product[] = [];

      /**
       * ------------------------------------------------------------------
       * Retrieve Products
       * ------------------------------------------------------------------
       *
       * Uses different retrieval strategies depending on the
       * customer's question.
       * ------------------------------------------------------------------
       */
      if (isCatalogQuestion) {
        /**
         * Retrieve all active products together with their inventory data.
         *
         * Out-of-stock products are also included in the catalog.
         */
        products = await this.productService.findAllForSupportChat();

        /**
         * Return a predefined response when no active products exist.
         *
         * This prevents unnecessary AI requests when the catalog is empty.
         */
        if (products.length === 0) {
          return {
            reply:
              'در حال حاضر هنوز محصولی در فروشگاه ثبت نشده است. ' +
              'به‌محض اضافه شدن محصولات، می‌توانید آن‌ها را در اینجا مشاهده کنید. ' +
              'اگر درباره انواع قهوه، تفاوت دانه‌ها یا روش‌های دم‌آوری سؤالی دارید، خوشحال می‌شوم راهنمایی‌تان کنم.',
          };
        }
      } else {
        /**
         * Search for products related to the customer's specific question.
         *
         * Example:
         * - Do you have Arabica coffee?
         * - What products contain chocolate flavor notes?
         */
        products = await this.productService.searchForSupportChat(message);
      }

      /**
       * ------------------------------------------------------------------
       * Build Product Context
       * ------------------------------------------------------------------
       *
       * Converts retrieved products into structured JSON data.
       *
       * This information is provided to the AI model so that
       * product-related answers are based on database records.
       *
       * Only the first 10 retrieved products are included in the context.
       * ------------------------------------------------------------------
       */
      const productContext =
        products.length > 0
          ? JSON.stringify(
              products.slice(0, 10).map((product) => {
                /**
                 * Retrieve the inventory relation associated with the product.
                 */
                const inventory = product.inventory;

                /**
                 * Calculate the quantity available for sale.
                 *
                 * Available Stock = Total Stock - Reserved Stock
                 *
                 * A null value indicates that inventory information
                 * was not retrieved.
                 */
                const availableStock = inventory
                  ? inventory.stock - inventory.reservedStock
                  : null;

                return {
                  /**
                   * Basic product information.
                   */
                  title: product.title,
                  description: product.description,
                  price: Number(product.price),
                  originalPrice: product.originalPrice
                    ? Number(product.originalPrice)
                    : null,

                  /**
                   * Product specifications and characteristics.
                   */
                  productType: product.productType,
                  weight: product.weight,
                  caffeineLevel: product.caffeineLevel,
                  flavorNotes: product.flavorNotes,
                  originCountry: product.originCountry,
                  ingredients: product.ingredients,
                  benefits: product.benefits,
                  howToUse: product.howToUse,

                  /**
                   * Product inventory information.
                   */
                  stock: inventory?.stock ?? null,
                  reservedStock: inventory?.reservedStock ?? null,
                  availableStock,

                  /**
                   * Convert the calculated available stock into
                   * a human-readable availability status.
                   *
                   * - null: Inventory information is unavailable.
                   * - greater than zero: Product is available.
                   * - zero: Product is out of stock.
                   */
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

      /**
       * ------------------------------------------------------------------
       * Generate AI Response
       * ------------------------------------------------------------------
       *
       * Sends the customer question and retrieved product information
       * to the local AI model.
       *
       * The system instructions define how the AI must use product
       * and inventory information when generating responses.
       * ------------------------------------------------------------------
       */
      const response = await this.ai.chat.completions.create({
        model: 'qwen3-4b-instruct-2507',
        messages: [
          {
            /**
             * System instructions define the AI's behavior and restrictions.
             */
            role: 'system',
            content: [
              /**
               * Include all provided active products when answering
               * product catalog questions.
               */
              'When the customer asks about the store catalog, list all provided active products, including out-of-stock products.',

              /**
               * Require the AI to clearly communicate product availability.
               */
              'For each product, clearly state its availability and available stock when that information is provided.',

              /**
               * Define how available stock is calculated.
               */
              'Available stock is the stock quantity minus the reserved stock quantity.',

              /**
               * Prevent incorrect availability claims.
               */
              'Never describe a product as available when its available stock is zero.',

              /**
               * Missing inventory information must be treated as unknown.
               */
              'If inventory information is missing, say that the availability is unknown.',

              /**
               * Prevent the AI from generating fictional inventory quantities.
               */
              'Never invent or estimate stock quantities.',
            ].join(' '),
          },
          {
            /**
             * The user message contains the original question and
             * the product information retrieved from the database.
             */
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

      /**
       * ------------------------------------------------------------------
       * Extract AI Response
       * ------------------------------------------------------------------
       *
       * Retrieves the generated text and removes unnecessary whitespace.
       * ------------------------------------------------------------------
       */
      const reply = response.choices[0]?.message?.content?.trim();

      /**
       * Validate the AI response.
       *
       * An empty response is treated as a service failure.
       */
      if (!reply) {
        throw new ServiceUnavailableException(
          'The AI service returned an empty response.',
        );
      }

      /**
       * Return the generated response to the customer.
       */
      return { reply };
    } catch (error: unknown) {
      /**
       * ------------------------------------------------------------------
       * Handle Service Errors
       * ------------------------------------------------------------------
       *
       * Prevents internal errors from being exposed directly
       * to the customer.
       * ------------------------------------------------------------------
       */

      /**
       * Re-throw known service availability errors.
       */
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }

      /**
       * Extract a readable error message for logging.
       */
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      /**
       * Record the AI service failure for debugging.
       */
      this.logger.error(`Local AI request failed: ${errorMessage}`);

      /**
       * Return a generic service error to the customer.
       */
      throw new ServiceUnavailableException(
        'The support chatbot is temporarily unavailable. Please try again later.',
      );
    }
  }
}
