import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';

import OpenAI from 'openai';

import { Product } from 'src/modules/products/entities/product.entity';
import { ProductService } from 'src/modules/products/services/product.service';

import { SupportChatHistoryService } from './support-chat-history.service';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

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
 * - Load and persist conversation history in Redis.
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

  constructor(
    private readonly productService: ProductService,
    private readonly supportChatHistoryService: SupportChatHistoryService,
  ) {
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
   * Is Catalog Question
   * ------------------------------------------------------------------------
   *
   * Determines whether the customer is requesting the store's product catalog.
   *
   * Responsibilities
   * ------------------------------------------------------------------------
   *
   * - Normalize the customer's message.
   * - Detect general product catalog requests.
   * - Distinguish catalog requests from specific product searches.
   *
   * @param message Customer's original message.
   * @returns True if the customer requests the product catalog.
   * ------------------------------------------------------------------------
   */

  private normalizeCustomerMessage(message: string): string {
    return message
      .trim()
      .toLowerCase()
      .replace(/[يى]/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      .replace(/[\u200c\u200f]/g, ' ')
      .replace(/[؟?!،,.؛:()[\]{}"«»]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * JavaScript `\b` only matches ASCII word characters, so it never
   * matches Persian words such as «محصولات» or «چیه».
   */
  private isCatalogQuestion(message: string): boolean {
    const normalizedMessage = this.normalizeCustomerMessage(message);
    const tokens = normalizedMessage.split(' ').filter((token) => token.length > 0);

    const isCatalogWord = (token: string): boolean =>
      token.startsWith('محصول') ||
      token.startsWith('کالا') ||
      token.startsWith('فروشگاه') ||
      token === 'اجناس' ||
      token === 'فهرست' ||
      token === 'لیست';

    const questionWords = new Set([
      'کدام',
      'کدوم',
      'همه',
      'تمام',
      'تمامی',
      'هست',
      'هستن',
      'هستش',
      'دارید',
      'دارین',
      'داری',
      'داره',
      'موجود',
      'موجوده',
      'موجودی',
      'نشون',
      'نشان',
      'نمایش',
    ]);

    const isQuestionWord = (token: string): boolean =>
      token.startsWith('چی') ||
      token.startsWith('چه') ||
      questionWords.has(token);

    const fillerWords = new Set([
      'سلام',
      'درود',
      'ببخشید',
      'لطفا',
      'من',
      'ما',
      'شما',
      'در',
      'از',
      'به',
      'برای',
      'را',
      'رو',
      'این',
      'آن',
      'اون',
      'یک',
      'یه',
      'توی',
      'تو',
      'بده',
      'کن',
      'کنید',
      'بگو',
      'بگید',
      'بگین',
      'الان',
      'خودت',
      'بهم',
    ]);

    const hasCatalogWord = tokens.some(isCatalogWord);
    const hasQuestionWord = tokens.some(isQuestionWord);
    const hasListWord = tokens.some((token) =>
      ['لیست', 'فهرست', 'همه', 'تمام', 'تمامی'].includes(token),
    );
    const asksToList = /(نشون بده|نشان بده|نمایش بده|لیست کن)/.test(
      normalizedMessage,
    );
    const asksWhatYouHave =
      /(چی دارین|چی دارید|چیا دارین|چیا دارید|چه دارید|چه دارین)/.test(
        normalizedMessage,
      );

    const specificTokens = tokens.filter(
      (token) =>
        !isCatalogWord(token) &&
        !isQuestionWord(token) &&
        !fillerWords.has(token),
    );

    if (specificTokens.length > 0) {
      return false;
    }

    return (
      asksWhatYouHave ||
      (hasCatalogWord && (hasQuestionWord || hasListWord || asksToList))
    );
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
   * - Conversation history is loaded from Redis when sessionId exists.
   * - Empty AI responses are treated as service errors.
   *
   * @param message Customer's message.
   * @param sessionId Optional conversation session identifier.
   * @returns AI-generated customer support response and session identifier.
   * ------------------------------------------------------------------------
   */
  async sendMessage(
message: string, sessionId?: string, user?: JwtPayload | null,
  ): Promise<{ reply: string; sessionId: string }> {
    /**
     * Log incoming support chat requests.
     */
    this.logger.log('Support chat request received');

    /**
     * Reuse the provided session or create a new conversation session.
     */
    const conversationSessionId = sessionId ?? randomUUID();

    try {
      /**
       * Load previous turns for this conversation from Redis.
       */
      const conversationHistory =
        await this.supportChatHistoryService.getHistory(conversationSessionId);

      this.logger.log(
        `Loaded conversation history messages: ${conversationHistory.length}`,
      );

      /**
       * Determine whether the customer is requesting the complete product catalog.
       */
      const isCatalogQuestion = this.isCatalogQuestion(message);

      this.logger.log(`Catalog question detected: ${isCatalogQuestion}`);

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
          const reply =
            'در حال حاضر هنوز محصولی در فروشگاه ثبت نشده است. ' +
            'به‌محض اضافه شدن محصولات، می‌توانید آن‌ها را در اینجا مشاهده کنید. ' +
            'اگر درباره انواع قهوه، تفاوت دانه‌ها یا روش‌های دم‌آوری سؤالی دارید، خوشحال می‌شوم راهنمایی‌تان کنم.';

          await this.supportChatHistoryService.appendTurn(
            conversationSessionId,
            message,
            reply,
          );

          return {
            reply,
            sessionId: conversationSessionId,
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

      this.logger.log(`Retrieved products count: ${products.length}`);

      this.logger.debug(
        `Retrieved product titles: ${products.map((product) => product.title).join(', ')}`,
      );

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
              products.map((product) => {
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
       * Sends the conversation history, customer question, and retrieved
       * product information to the local AI model.
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
              'When the customer asks about the store catalog, list every provided product by its exact title, including products whose available stock is zero.',
              'A provided product exists in the store. Available stock of zero means it is temporarily out of stock, not that the store has no products.',
              'Never say that no product is registered, or that the catalog is empty, when product information is provided.',

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

              /**
               * Use previous conversation turns for continuity.
               */
              'Use the previous conversation turns to answer follow-up questions accurately.',
            ].join(' '),
          },
          /**
           * Previous customer and assistant turns from Redis.
           */
          ...conversationHistory.map((historyMessage) => ({
            role: historyMessage.role,
            content: historyMessage.content,
          })),
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
       * Persist the completed turn so follow-up questions keep context.
       */
      await this.supportChatHistoryService.appendTurn(
        conversationSessionId,
        message,
        reply,
      );

      /**
       * Return the generated response and conversation session identifier.
       */
      return {
        reply,
        sessionId: conversationSessionId,
      };
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
