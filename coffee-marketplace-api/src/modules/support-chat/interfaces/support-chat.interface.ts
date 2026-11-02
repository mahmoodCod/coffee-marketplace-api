import { SupportChatIntent } from '../enums/support-chat-intent.enum';

/**
 * ------------------------------------------------------------------------
 * Intent Detection Result
 * ------------------------------------------------------------------------
 *
 * Represents the result of customer message classification.
 * ------------------------------------------------------------------------
 */
export interface IntentDetectionResult {
  /**
   * Classified customer request type.
   */
  intent: SupportChatIntent;

  /**
   * Confidence score between 0 and 1.
   */
  confidence: number;
}

/**
 * ------------------------------------------------------------------------
 * Product Search Query
 * ------------------------------------------------------------------------
 *
 * Contains the extracted information required to search for products.
 * ------------------------------------------------------------------------
 */
export interface ProductSearchQuery {
  /**
   * Main product search phrase.
   *
   * Example: قهوه عربیکا
   */
  searchTerm: string;

  /**
   * Optional product characteristics.
   *
   * Example: originCountry, productType, flavorNotes
   */
  filters?: Record<string, string>;
}
