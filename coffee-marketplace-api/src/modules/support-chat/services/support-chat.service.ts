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
    const tokens = normalizedMessage
      .split(' ')
      .filter((token) => token.length > 0);

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
   * Is Product Follow-Up Question
   * ------------------------------------------------------------------------
   *
   * Detects questions that refer to a product mentioned earlier
   * in the conversation.
   *
   * Examples:
   * - قیمتش چنده؟
   * - موجوده؟
   * - مشخصاتش چیه؟
   * - وزنش چقدره؟
   * ------------------------------------------------------------------------
   */

  private isProductFollowUpQuestion(message: string): boolean {
    const normalizedMessage = this.normalizeCustomerMessage(message);

    const followUpPatterns = [
      /قیمتش/,
      /قیمت\s+(این|اون|همون)/,
      /^(چنده|چقدره|موجوده|موجود\s+هست)$/,
      /^(این|اون|همون)(\s+(محصول|قهوه|کالا))?(\s+(چنده|چقدره|موجوده|موجود\s+هست))?$/,
      /موجودی\s+(این|اون|همون)/,
      /مشخصاتش/,
      /ویژگی\s*هاش/,
      /ترکیباتش/,
      /طعمش/,
      /وزنش/,
      /کشورش/,
      /درباره\s+(این|اون|همون)/,
    ];

    return followUpPatterns.some((pattern) => pattern.test(normalizedMessage));
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
    message: string,
    sessionId?: string,
    user?: JwtPayload | null,
  ): Promise<{ reply: string; sessionId: string }> {
    this.logger.log('Support chat request received');

    const conversationSessionId = sessionId ?? randomUUID();

    try {
      const conversationHistory =
        await this.supportChatHistoryService.getHistory(conversationSessionId);

      this.logger.log(
        `Loaded conversation history messages: ${conversationHistory.length}`,
      );

      const isCatalogQuestion = this.isCatalogQuestion(message);
      const isProductFollowUp = this.isProductFollowUpQuestion(message);

      this.logger.log(`Catalog question detected: ${isCatalogQuestion}`);
      this.logger.log(`Product follow-up detected: ${isProductFollowUp}`);

      let products: Product[] = [];

      /**
       * --------------------------------------------------------------------
       * Resolve Product Follow-Up
       * --------------------------------------------------------------------
       *
       * Resolve references to previously mentioned products using
       * product IDs stored in Redis.
       *
       * Product details are always retrieved from PostgreSQL.
       * --------------------------------------------------------------------
       */
      if (isProductFollowUp) {
        const referencedProductIds =
          await this.supportChatHistoryService.getReferencedProductIds(
            conversationSessionId,
          );

        /**
         * A follow-up question without product context cannot be
         * reliably associated with a specific product.
         */
        if (referencedProductIds.length === 0) {
          const reply =
            'برای پاسخ دقیق‌تر، لطفاً نام محصول موردنظرتان را مشخص کنید.';

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

        /**
         * Retrieve previously referenced products from PostgreSQL.
         *
         * Inactive or deleted products are excluded by ProductService.
         */
        products =
          await this.productService.findProductsByIdsForSupportChat(
            referencedProductIds,
          );

        /**
         * Previously referenced products may have become inactive
         * or deleted since the last conversation turn.
         */
        if (products.length === 0) {
          await this.supportChatHistoryService.saveReferencedProductIds(
            conversationSessionId,
            [],
          );

          const reply =
            'محصولی که قبلاً درباره آن صحبت کردیم، دیگر در فهرست محصولات فعال فروشگاه قرار ندارد. لطفاً محصول دیگری را انتخاب کنید.';

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

        /**
         * If multiple products remain, never select one arbitrarily.
         */
        if (products.length > 1) {
          const productTitles = products
            .map((product) => `- ${product.title}`)
            .join('\n');

          const reply = `منظورتان کدام محصول است؟ لطفاً یکی از محصولات زیر را مشخص کنید:\n${productTitles}`;

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

        this.logger.log(`Resolved follow-up product: ${products[0].title}`);
      } else if (isCatalogQuestion) {
        /**
         * Retrieve all active products, including out-of-stock products.
         */
        products = await this.productService.findAllForSupportChat();

        /**
         * Store all products presented in the catalog response.
         *
         * Multiple products will require clarification in follow-up questions.
         */
        await this.supportChatHistoryService.saveReferencedProductIds(
          conversationSessionId,
          products.map((product) => product.id),
        );

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
         * Search for products related to the current customer message.
         */
        products = await this.productService.searchForSupportChat(message);

        /**
         * Update product context only when relevant products are found.
         *
         * General questions without matching products do not erase
         * the previously established product context.
         */
        if (products.length > 0) {
          await this.supportChatHistoryService.saveReferencedProductIds(
            conversationSessionId,
            products.map((product) => product.id),
          );
        }
      }

      this.logger.log(`Retrieved products count: ${products.length}`);

      this.logger.debug(
        `Retrieved product titles: ${products
          .map((product) => product.title)
          .join(', ')}`,
      );

      /**
       * --------------------------------------------------------------------
       * Build Product Context
       * --------------------------------------------------------------------
       *
       * Product and inventory information is retrieved from PostgreSQL.
       * --------------------------------------------------------------------
       */
      const productContext =
        products.length > 0
          ? JSON.stringify(
              products.map((product) => {
                const inventory = product.inventory;

                const availableStock = inventory
                  ? inventory.stock - inventory.reservedStock
                  : null;

                return {
                  id: product.id,
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

      /**
       * --------------------------------------------------------------------
       * Generate AI Response
       * --------------------------------------------------------------------
       */
      const response = await this.ai.chat.completions.create({
        model: 'qwen3-4b-instruct-2507',
        messages: [
          {
            role: 'system',
            content: [
              'You are a customer support assistant for a coffee marketplace.',
              'Use the conversation history to understand the customer question.',
              'Use only the provided product information for product-related answers.',
              'Never invent product names, prices, discounts, or inventory quantities.',
              'Always use the exact product title provided by the database.',
              'When answering catalog questions, list every provided product.',
              'A product with zero available stock still exists in the catalog.',
              'Never claim that the catalog is empty when product information is provided.',
              'Available stock equals stock minus reserved stock.',
              'Never describe a product as available when its available stock is zero.',
              'If inventory information is missing, say that availability is unknown.',
              'For follow-up questions, use the retrieved product information rather than relying on previous AI responses.',
              'If the provided product information does not contain the requested detail, clearly say that the information is unavailable.',
              'Respond naturally in Persian when the customer writes in Persian.',
            ].join(' '),
          },
          ...conversationHistory.map((historyMessage) => ({
            role: historyMessage.role,
            content: historyMessage.content,
          })),
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

      /**
       * Persist the completed conversation turn.
       */
      await this.supportChatHistoryService.appendTurn(
        conversationSessionId,
        message,
        reply,
      );

      return {
        reply,
        sessionId: conversationSessionId,
      };
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
