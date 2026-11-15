import {
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import OpenAI from 'openai';

import { Product } from 'src/modules/products/entities/product.entity';
import { ProductService } from 'src/modules/products/services/product.service';
import { JwtPayload } from 'src/modules/auth/interfaces/jwt-payload.interface';

import { ConversationOwner } from '../domain/models/conversation-owner.model';
import {
  ConversationMessage,
  ConversationTurn,
} from '../domain/models/conversation-message.model';

import { ConversationLifecycleUseCase } from '../domain/application/use-cases/conversation-lifecycle.use-case';
import { ConversationHistoryUseCase } from '../domain/application/use-cases/conversation-history.use-case';
import { ConversationStateUseCase } from '../domain/application/use-cases/conversation-state.use-case';
import { GuestIdentityUseCase } from '../domain/application/use-cases/guest-identity.use-case';
import { ProductReferenceUseCase } from '../domain/application/use-cases/product-reference.use-case';

import {
  SUPPORT_CHAT_HISTORY_TTL_SECONDS,
  SUPPORT_CHAT_GUEST_IDENTITY_TTL_SECONDS,
} from '../constants/support-chat-history.constants';
import { ConversationProductReference } from '../domain/models/product-reference.model';

/**
 * ------------------------------------------------------------------------
 * Support Chat Service
 * ------------------------------------------------------------------------
 *
 * Coordinates customer conversations and AI responses.
 *
 * Responsibilities:
 * - Resolve guest and authenticated conversation ownership.
 * - Create or retrieve conversations.
 * - Manage conversation history and state.
 * - Manage conversation-scoped product references.
 * - Retrieve authoritative product information from PostgreSQL.
 * - Generate responses using the local AI server.
 *
 * Security:
 * - Raw guest tokens are returned only to the HTTP layer.
 * - Product UUIDs are never exposed to the AI model.
 * - Conversation ownership is validated by the Use Cases.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class SupportChatService {
  private readonly logger = new Logger(SupportChatService.name);

  private readonly ai: OpenAI;

  constructor(
    private readonly productService: ProductService,
    private readonly conversationLifecycle: ConversationLifecycleUseCase,
    private readonly conversationHistory: ConversationHistoryUseCase,
    private readonly conversationState: ConversationStateUseCase,
    private readonly guestIdentity: GuestIdentityUseCase,
    private readonly productReferences: ProductReferenceUseCase,
  ) {
    // Connect to the local OpenAI-compatible LM Studio server.
    this.ai = new OpenAI({
      apiKey: 'lm-studio',
      baseURL: 'http://127.0.0.1:5001/v1',
    });
  }

  /**
   * Normalizes Persian and Arabic characters before intent detection.
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
   * Detects general product catalog requests.
   */
  private isCatalogQuestion(message: string): boolean {
    const normalized = this.normalizeCustomerMessage(message);

    // Detect common Persian catalog questions directly.
    const catalogPatterns = [
      /چه\s+محصولی/,
      /چه\s+محصولاتی/,
      /چه\s+قهوه/,
      /چه\s+کالا/,
      /چه\s+اجناسی/,
      /چه\s+چیزی\s+دارید/,
      /چی\s+دارید/,
      /چی\s+دارین/,
      /چیا\s+دارید/,
      /چیا\s+دارین/,
      /محصولات\s+(شما|فروشگاه|فروشگاهت)/,
      /محصولی\s+در\s+(فروشگاه|فروشگاهت)/,
      /لیست\s+محصولات/,
      /فهرست\s+محصولات/,
      /همه\s+محصولات/,
      /تمام\s+محصولات/,
      /محصولات\s+موجود/,
    ];

    if (catalogPatterns.some((pattern) => pattern.test(normalized))) {
      return true;
    }

    const tokens = normalized.split(' ').filter(Boolean);

    const catalogWords = new Set([
      'محصول',
      'محصولات',
      'محصولی',
      'کالا',
      'کالاها',
      'فروشگاه',
      'قهوه',
      'قهوه‌ها',
      'تجهیزات',
      'اجناس',
      'فهرست',
      'لیست',
    ]);

    const questionWords = new Set([
      'چی',
      'چیا',
      'چه',
      'کدام',
      'کدوم',
      'همه',
      'تمام',
      'تمامی',
      'دارید',
      'دارین',
      'داری',
      'داره',
      'دارند',
      'دارن',
      'موجود',
      'موجوده',
      'نشون',
      'نشان',
      'نمایش',
      'معرفی',
    ]);

    const hasCatalogWord = tokens.some((token) => catalogWords.has(token));

    const hasQuestionWord = tokens.some((token) => questionWords.has(token));

    return hasCatalogWord && hasQuestionWord;
  }
  /**
   * Detects questions referring to a previously discussed product.
   */
  private isProductFollowUpQuestion(message: string): boolean {
    const normalized = this.normalizeCustomerMessage(message);

    const patterns = [
      // Price questions.
      /قیمتش/,
      /قیمت\s+(این|اون|همون)/,

      // Inventory and availability questions.
      /موجودی/,
      /موجوده/,
      /ناموجود/,
      /موجود\s+هست/,
      /چقدر\s+موجود/,
      /چه\s+مقدار\s+موجود/,
      /چند\s+تا\s+موجود/,
      /چند\s+عدد\s+موجود/,
      /ازش\s+چقدر/,
      /ازش\s+چند/,

      // Short follow-up questions.
      /^(چنده|چقدره|موجوده|موجود\s+هست)$/,

      // Product references.
      /^(این|اون|همون)(\s+(محصول|قهوه|کالا))?(\s+(چنده|چقدره|موجوده|موجود\s+هست))?$/,

      // Product detail questions.
      /مشخصاتش/,
      /ویژگی\s*هاش/,
      /ترکیباتش/,
      /طعمش/,
      /وزنش/,
      /کشورش/,
      /درباره\s+(این|اون|همون)/,
    ];

    return patterns.some((pattern) => pattern.test(normalized));
  }
  /**
   * Resolves ordinal product selections.
   *
   * Supports direct ordinal messages and natural Persian expressions.
   * The returned index is zero-based.
   */
  private getProductSelectionIndex(message: string): number | null {
    const normalized = this.normalizeCustomerMessage(message);

    const ordinalMap = new Map<string, number>([
      ['اول', 0],
      ['اولی', 0],
      ['اولین', 0],
      ['یکم', 0],
      ['1', 0],
      ['۱', 0],
      ['دوم', 1],
      ['دومی', 1],
      ['دومین', 1],
      ['2', 1],
      ['۲', 1],
      ['سوم', 2],
      ['سومی', 2],
      ['سومین', 2],
      ['3', 2],
      ['۳', 2],
      ['چهارم', 3],
      ['چهارمی', 3],
      ['4', 3],
      ['۴', 3],
      ['پنجم', 4],
      ['پنجمی', 4],
      ['5', 4],
      ['۵', 4],
    ]);

    // Handle direct ordinal selections.
    const directSelection = normalized.replace(/^(مورد|محصول|گزینه)\s+/, '');

    const directIndex = ordinalMap.get(directSelection);

    if (directIndex !== undefined) {
      return directIndex;
    }

    // Handle ordinal selections inside natural Persian sentences.
    const ordinalPattern =
      /(?:مورد|محصول|گزینه)\s*(اولی|اولین|اول|یکم|دومی|دومین|دوم|سومی|سومین|سوم|چهارمی|چهارم|پنجمی|پنجم|[1-5۱-۵])(?:\s|$)/;

    const match = normalized.match(ordinalPattern);

    if (!match) {
      return null;
    }

    return ordinalMap.get(match[1]) ?? null;
  }
  /**
   * Returns product references in their original display order.
   */
  private async getOrderedProductReferences(
    conversationId: string,
    owner: ConversationOwner,
  ): Promise<ConversationProductReference[]> {
    return this.productReferences.getAll(conversationId, owner);
  }
  /**
   * Resolves the requester and creates or retrieves their conversation.
   */
  private async resolveConversation(
    conversationId: string | undefined,
    user: JwtPayload | null,
    rawGuestToken?: string,
  ) {
    let owner: ConversationOwner;
    let guestToken: string | undefined;

    if (user) {
      owner = {
        type: 'user',
        id: user.sub,
      };
    } else {
      const guest = await this.guestIdentity.resolve(
        rawGuestToken,
        SUPPORT_CHAT_GUEST_IDENTITY_TTL_SECONDS,
      );

      owner = {
        type: 'guest',
        id: guest.guestIdentity.id,
      };

      guestToken = guest.rawToken;
    }

    // Existing conversations must belong to the resolved requester.
    const conversation = conversationId
      ? await this.conversationLifecycle.get(conversationId, owner)
      : await this.conversationLifecycle.create(
          owner,
          SUPPORT_CHAT_HISTORY_TTL_SECONDS,
        );

    // Refresh the conversation expiration after a valid customer request.
    await this.conversationLifecycle.refreshExpiration(
      conversation.id,
      owner,
      SUPPORT_CHAT_HISTORY_TTL_SECONDS,
    );

    return {
      conversationId: conversation.id,
      owner,
      guestToken,
    };
  }

  /**
   * Persists a completed user/assistant turn.
   */
  private async persistTurn(
    conversationId: string,
    owner: ConversationOwner,
    message: string,
    reply: string,
    previousTurns: ConversationTurn[],
  ): Promise<void> {
    const now = new Date();

    const userMessage: ConversationMessage = {
      id: randomUUID(),
      conversationId,
      role: 'user',
      content: message,
      createdAt: now,
    };

    const assistantMessage: ConversationMessage = {
      id: randomUUID(),
      conversationId,
      role: 'assistant',
      content: reply,
      createdAt: now,
    };

    const lastTurn = previousTurns.reduce<ConversationTurn | null>(
      (latest, current) =>
        !latest || current.sequence > latest.sequence ? current : latest,
      null,
    );

    const turn: ConversationTurn = {
      requestId: randomUUID(),
      sequence: lastTurn ? lastTurn.sequence + 1 : 1,
      messages: [userMessage, assistantMessage],
      createdAt: now,
    };

    await this.conversationHistory.appendTurn(conversationId, owner, turn);
  }

  /**
   * Creates a short response and persists it as a conversation turn.
   */
  private async returnShortReply(
    conversationId: string,
    owner: ConversationOwner,
    message: string,
    reply: string,
    history: ConversationTurn[],
    guestToken?: string,
  ) {
    await this.persistTurn(conversationId, owner, message, reply, history);

    return {
      reply,
      conversationId,
      ...(guestToken ? { guestToken } : {}),
    };
  }

  /**
   * Loads products in the exact order of their conversation references.
   */
  private async loadReferencedProducts(
    conversationId: string,
    owner: ConversationOwner,
  ): Promise<Product[]> {
    const references = await this.getOrderedProductReferences(
      conversationId,
      owner,
    );

    if (references.length === 0) {
      return [];
    }

    const products = await this.productService.findProductsByIdsForSupportChat(
      references.map((item) => item.productId),
    );

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    return references
      .map((reference) => productMap.get(reference.productId))
      .filter((product): product is Product => product !== undefined);
  }

  /**
   * Replaces the conversation's product references with the supplied products.
   */
  private async replaceProductReferences(
    conversationId: string,
    owner: ConversationOwner,
    products: Product[],
    source: 'catalog_search' | 'product_details',
  ): Promise<void> {
    await this.productReferences.deleteAll(conversationId, owner);

    // Create references while preserving the original product display order.
    for (const [position, product] of products.entries()) {
      await this.productReferences.create(
        conversationId,
        owner,
        product.id,
        source,
        position,
      );
    }
  }

  /**
   * Processes a customer message and generates an AI response.
   */
  async sendMessage(
    message: string,
    conversationId?: string,
    user?: JwtPayload | null,
    rawGuestToken?: string,
  ): Promise<{
    reply: string;
    conversationId: string;
    guestToken?: string;
  }> {
    this.logger.log('Support chat request received');

    try {
      const resolved = await this.resolveConversation(
        conversationId,
        user ?? null,
        rawGuestToken,
      );

      const {
        conversationId: activeConversationId,
        owner,
        guestToken,
      } = resolved;

      const history = await this.conversationHistory.getHistory(
        activeConversationId,
        owner,
      );

      const previousMessages = history.flatMap((turn) => turn.messages);

      const catalogQuestion = this.isCatalogQuestion(message);
      const followUpQuestion = this.isProductFollowUpQuestion(message);
      const selectionIndex = this.getProductSelectionIndex(message);

      this.logger.debug(
        JSON.stringify({
          message,
          catalogQuestion,
          followUpQuestion,
          selectionIndex,
        }),
      );

      let products: Product[] = [];

      const state = await this.conversationState.get(
        activeConversationId,
        owner,
      );

      this.logger.debug(
        JSON.stringify({
          activeProductReference: state?.activeProductReference ?? null,
        }),
      );

      /**
       * Resolve an ordinal selection from conversation-scoped references.
       */
      if (selectionIndex !== null) {
        const references = await this.getOrderedProductReferences(
          activeConversationId,
          owner,
        );

        const selectedReference = references[selectionIndex];

        if (!selectedReference) {
          return this.returnShortReply(
            activeConversationId,
            owner,
            message,
            'این شماره در فهرست محصولات قبلی وجود ندارد. لطفاً یکی از محصولات نمایش‌داده‌شده را انتخاب کنید.',
            history,
            guestToken,
          );
        }

        // Resolve the selected product using its existing reference.
        products = await this.productService.findProductsByIdsForSupportChat([
          selectedReference.productId,
        ]);

        const selectedProduct = products[0];

        if (!selectedProduct) {
          return this.returnShortReply(
            activeConversationId,
            owner,
            message,
            'محصول انتخاب‌شده دیگر در فهرست محصولات فعال فروشگاه قرار ندارد. لطفاً محصول دیگری را انتخاب کنید.',
            history,
            guestToken,
          );
        }

        // Reuse the existing reference instead of creating a duplicate.
        await this.conversationState.update(activeConversationId, owner, {
          conversationId: activeConversationId,
          activeProductReference: selectedReference.reference,
          updatedAt: new Date(),
        });
      } else if (followUpQuestion) {
        if (state?.activeProductReference) {
          const reference = await this.productReferences.getByReference(
            activeConversationId,
            owner,
            state.activeProductReference,
          );

          products = await this.productService.findProductsByIdsForSupportChat([
            reference.productId,
          ]);

          if (products.length === 0) {
            await this.conversationState.update(activeConversationId, owner, {
              conversationId: activeConversationId,
              activeProductReference: null,
              updatedAt: new Date(),
            });

            return this.returnShortReply(
              activeConversationId,
              owner,
              message,
              'محصول انتخاب‌شده دیگر در فهرست محصولات فعال فروشگاه قرار ندارد. لطفاً محصول دیگری را انتخاب کنید.',
              history,
              guestToken,
            );
          }
        } else {
          products = await this.loadReferencedProducts(
            activeConversationId,
            owner,
          );

          this.logger.debug(`Follow-up products retrieved: ${products.length}`);

          if (products.length === 0) {
            return this.returnShortReply(
              activeConversationId,
              owner,
              message,
              'برای پاسخ دقیق‌تر، لطفاً نام محصول موردنظرتان را مشخص کنید.',
              history,
              guestToken,
            );
          }

          if (products.length > 1) {
            const productTitles = products
              .map((product, index) => `${index + 1}. ${product.title}`)
              .join('\n');

            return this.returnShortReply(
              activeConversationId,
              owner,
              message,
              `منظورتان کدام محصول است؟ لطفاً یکی از محصولات زیر را انتخاب کنید:\n${productTitles}`,
              history,
              guestToken,
            );
          }

          // Reuse the existing reference for the only matching product.
          const references = await this.getOrderedProductReferences(
            activeConversationId,
            owner,
          );

          const selectedReference = references.find(
            (reference) => reference.productId === products[0].id,
          );

          if (!selectedReference) {
            throw new Error(
              'The product reference for the selected product was not found.',
            );
          }

          await this.conversationState.update(activeConversationId, owner, {
            conversationId: activeConversationId,
            activeProductReference: selectedReference.reference,
            updatedAt: new Date(),
          });
        }
      } else if (catalogQuestion) {
        // Include all active products, including products with zero stock.
        products = await this.productService.findAllForSupportChat();

        await this.replaceProductReferences(
          activeConversationId,
          owner,
          products,
          'catalog_search',
        );

        await this.conversationState.update(activeConversationId, owner, {
          conversationId: activeConversationId,
          activeProductReference: null,
          updatedAt: new Date(),
        });

        if (products.length === 0) {
          return this.returnShortReply(
            activeConversationId,
            owner,
            message,
            'در حال حاضر هنوز محصولی در فروشگاه ثبت نشده است. به‌محض اضافه شدن محصولات، می‌توانید آن‌ها را در اینجا مشاهده کنید. اگر درباره انواع قهوه، تفاوت دانه‌ها یا روش‌های دم‌آوری سؤالی دارید، خوشحال می‌شوم راهنمایی‌تان کنم.',
            history,
            guestToken,
          );
        }
      } else {
        // Search results replace the previous product list only when matches exist.
        products = await this.productService.searchForSupportChat(message);

        if (products.length > 0) {
          await this.replaceProductReferences(
            activeConversationId,
            owner,
            products,
            'catalog_search',
          );

          await this.conversationState.update(activeConversationId, owner, {
            conversationId: activeConversationId,
            activeProductReference: null,
            updatedAt: new Date(),
          });
        }
      }

      this.logger.log(`Retrieved products count: ${products.length}`);

      /**
       * Build product context using opaque references instead of database IDs.
       */
      const references = await this.getOrderedProductReferences(
        activeConversationId,
        owner,
      );

      const referenceByProductId = new Map(
        references.map((reference) => [
          reference.productId,
          reference.reference,
        ]),
      );

      const productContext =
        products.length > 0
          ? JSON.stringify(
              products.map((product) => {
                const inventory = product.inventory;

                const availableStock = inventory
                  ? inventory.stock - inventory.reservedStock
                  : null;

                return {
                  reference: referenceByProductId.get(product.id) ?? null,
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
       * Generate the AI response using persisted conversation history.
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
              'If product details are missing, clearly say that the information is unavailable.',
              'Product references are internal conversation references, not product IDs.',
              'Never reveal internal references, UUIDs, or technical identifiers to customers.',
              'Respond naturally in Persian when the customer writes in Persian.',
            ].join(' '),
          },
          ...previousMessages
            .filter((item) => item.role === 'user' || item.role === 'assistant')
            .map((item) => ({
              role: item.role,
              content: item.content,
            })),
          {
            role: 'user',
            content: [
              `Customer question:\n${message}`,
              `Available product information:\n${productContext}`,
              'Please answer the customer naturally and accurately.',
            ].join('\n\n'),
          },
        ],
      });

      const reply = response.choices[0]?.message?.content?.trim();

      if (!reply) {
        throw new ServiceUnavailableException(
          'The AI service returned an empty response.',
        );
      }

      await this.persistTurn(
        activeConversationId,
        owner,
        message,
        reply,
        history,
      );

      return {
        reply,
        conversationId: activeConversationId,
        ...(guestToken ? { guestToken } : {}),
      };
    } catch (error: unknown) {
      // Preserve intentional HTTP errors and their original status codes.
      if (error instanceof HttpException) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Support chat request failed: ${errorMessage}`,
        errorStack,
      );

      throw new ServiceUnavailableException(
        'The support chatbot is temporarily unavailable. Please try again later.',
      );
    }
  }
}
