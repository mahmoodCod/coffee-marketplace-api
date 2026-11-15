/**
 * Defines how a product reference was created.
 *
 * - catalog_search: The product was found through catalog search.
 * - product_details: The product was explicitly requested for details.
 */
export type ProductReferenceSource = 'catalog_search' | 'product_details';

/**
 * Represents a conversation-scoped reference to a product.
 *
 * The AI model receives the reference instead of the actual
 * database product ID.
 */
export interface ConversationProductReference {
  /** Opaque reference exposed to the AI model. */
  readonly reference: string;

  /** Conversation that owns this reference. */
  readonly conversationId: string;

  /** Actual product ID stored internally by the backend. */
  readonly productId: string;

  /** Indicates how this reference was created. */
  readonly source: ProductReferenceSource;

  /** Position of the product in the displayed result list. */
  readonly position: number;

  /** Reference creation timestamp. */
  readonly createdAt: Date;
}

/**
 * Defines the required data for creating a product reference.
 */
export interface CreateProductReferenceInput {
  conversationId: string;
  productId: string;
  source: ProductReferenceSource;
  position: number;
  reference?: string;
  createdAt?: Date;
}
