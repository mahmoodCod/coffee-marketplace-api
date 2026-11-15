import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../../../redis/redis.service';
import type { ProductReferenceRepository } from '../../../domain/repositories/product-reference.repository';
import type {
  ConversationProductReference,
  ProductReferenceSource,
} from '../../../domain/models/product-reference.model';

@Injectable()
export class RedisProductReferenceRepository implements ProductReferenceRepository {
  private readonly keyPrefix = 'support-chat:product-references:';
  private readonly ttlSeconds = 24 * 60 * 60;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Generates the Redis key for a conversation's product references.
   */
  private getKey(conversationId: string): string {
    return `${this.keyPrefix}{${conversationId}}`;
  }

  /**
   * Validates the conversation identifier.
   */
  private validateConversationId(conversationId: string): void {
    if (!conversationId || !conversationId.trim()) {
      throw new Error('Conversation ID must not be empty.');
    }
  }

  /**
   * Validates the opaque product reference.
   */
  private validateReference(reference: string): void {
    if (!reference || !reference.trim()) {
      throw new Error('Product reference must not be empty.');
    }
  }

  /**
   * Validates a product reference before persistence.
   */
  private validateProductReference(
    productReference: ConversationProductReference,
  ): void {
    this.validateConversationId(productReference.conversationId);
    this.validateReference(productReference.reference);

    if (!productReference.productId?.trim()) {
      throw new Error('Product ID must not be empty.');
    }

    const validSources: ProductReferenceSource[] = [
      'catalog_search',
      'product_details',
    ];

    if (!validSources.includes(productReference.source)) {
      throw new Error('Invalid product reference source.');
    }

    if (
      !Number.isSafeInteger(productReference.position) ||
      productReference.position < 0
    ) {
      throw new Error('Product reference position is invalid.');
    }

    if (
      !(productReference.createdAt instanceof Date) ||
      Number.isNaN(productReference.createdAt.getTime())
    ) {
      throw new Error('Product reference creation date must be valid.');
    }
  }

  /**
   * Serializes a product reference for Redis storage.
   */
  private serialize(productReference: ConversationProductReference): string {
    return JSON.stringify(productReference);
  }

  /**
   * Restores and validates a serialized product reference.
   */
  private deserialize(
    serializedReference: string,
  ): ConversationProductReference {
    let parsed: unknown;

    try {
      parsed = JSON.parse(serializedReference);
    } catch {
      throw new Error('Stored product reference contains invalid JSON.');
    }

    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Stored product reference has an invalid structure.');
    }

    const data = parsed as Record<string, unknown>;

    const productReference: ConversationProductReference = {
      reference: String(data.reference ?? ''),
      conversationId: String(data.conversationId ?? ''),
      productId: String(data.productId ?? ''),
      source: data.source as ProductReferenceSource,

      // Support references created before the position field was introduced.
      position: data.position === undefined ? 0 : Number(data.position),

      createdAt: new Date(String(data.createdAt ?? '')),
    };

    this.validateProductReference(productReference);

    return productReference;
  }

  /**
   * Saves or replaces a product reference in the conversation hash.
   */
  async save(productReference: ConversationProductReference): Promise<void> {
    this.validateProductReference(productReference);

    const key = this.getKey(productReference.conversationId);

    // Store references as hash fields to support atomic lookup and deletion.
    const result = await this.redisService.eval(
      `
        redis.call('HSET', KEYS[1], ARGV[1], ARGV[2])
        redis.call('EXPIRE', KEYS[1], ARGV[3])
        return 1
      `,
      1,
      key,
      productReference.reference,
      this.serialize(productReference),
      this.ttlSeconds,
    );

    if (Number(result) !== 1) {
      throw new Error('Failed to save product reference.');
    }
  }

  /**
   * Finds a reference only within its owning conversation.
   */
  async findByReference(
    conversationId: string,
    reference: string,
  ): Promise<ConversationProductReference | null> {
    this.validateConversationId(conversationId);
    this.validateReference(reference);

    const serializedReference = await this.redisService.eval(
      `return redis.call('HGET', KEYS[1], ARGV[1])`,
      1,
      this.getKey(conversationId),
      reference,
    );

    if (typeof serializedReference !== 'string') {
      return null;
    }

    const productReference = this.deserialize(serializedReference);

    if (productReference.conversationId !== conversationId) {
      throw new Error(
        'Stored product reference belongs to another conversation.',
      );
    }

    if (productReference.reference !== reference) {
      throw new Error('Stored product reference does not match its key.');
    }

    return productReference;
  }

  /**
   * Retrieves every product reference belonging to a conversation.
   */
  async findAllByConversationId(
    conversationId: string,
  ): Promise<ConversationProductReference[]> {
    this.validateConversationId(conversationId);

    const serializedReferences = await this.redisService.eval(
      `return redis.call('HVALS', KEYS[1])`,
      1,
      this.getKey(conversationId),
    );

    if (!Array.isArray(serializedReferences)) {
      throw new Error('Failed to retrieve conversation product references.');
    }

    const productReferences = serializedReferences.map((value) => {
      if (typeof value !== 'string') {
        throw new Error('Stored product reference has an invalid Redis value.');
      }

      const productReference = this.deserialize(value);

      if (productReference.conversationId !== conversationId) {
        throw new Error(
          'Stored product reference belongs to another conversation.',
        );
      }

      return productReference;
    });

    // Redis hash values have no guaranteed order, so sort explicitly.
    return productReferences.sort((a, b) => {
      if (a.position !== b.position) {
        return a.position - b.position;
      }

      const createdAtDifference = a.createdAt.getTime() - b.createdAt.getTime();

      if (createdAtDifference !== 0) {
        return createdAtDifference;
      }

      return a.reference.localeCompare(b.reference);
    });
  }

  /**
   * Deletes one product reference from its owning conversation.
   */
  async delete(conversationId: string, reference: string): Promise<void> {
    this.validateConversationId(conversationId);
    this.validateReference(reference);

    await this.redisService.eval(
      `return redis.call('HDEL', KEYS[1], ARGV[1])`,
      1,
      this.getKey(conversationId),
      reference,
    );
  }

  /**
   * Deletes all product references belonging to a conversation.
   */
  async deleteAllByConversationId(conversationId: string): Promise<void> {
    this.validateConversationId(conversationId);

    await this.redisService.del(this.getKey(conversationId));
  }
}
