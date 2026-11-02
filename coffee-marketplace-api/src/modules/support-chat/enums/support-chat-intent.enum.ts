/**
 * ------------------------------------------------------------------------
 * Support Chat Intent
 * ------------------------------------------------------------------------
 *
 * Defines the supported customer request types.
 *
 * Each intent represents a specific purpose behind a customer message.
 * The intent determines which processing strategy the chatbot should use.
 * ------------------------------------------------------------------------
 */
export enum SupportChatIntent {
  /**
   * Customer is searching for a specific product.
   */
  PRODUCT_SEARCH = 'PRODUCT_SEARCH',

  /**
   * Customer requests the complete product catalog.
   */
  CATALOG_LIST = 'CATALOG_LIST',

  /**
   * Customer requests detailed information about a product.
   */
  PRODUCT_DETAILS = 'PRODUCT_DETAILS',

  /**
   * Customer asks a general question about coffee or shopping.
   */
  GENERAL_QUESTION = 'GENERAL_QUESTION',

  /**
   * Customer requests information about an existing order.
   */
  ORDER_STATUS = 'ORDER_STATUS',

  /**
   * Customer message cannot be classified.
   */
  UNKNOWN = 'UNKNOWN',
}
