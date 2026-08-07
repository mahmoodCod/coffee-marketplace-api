/**
 * ------------------------------------------------------------------------
 * Product Status Enum
 * ------------------------------------------------------------------------
 *
 * Controls product lifecycle.
 *
 * Product flow:
 *
 * DRAFT
 *   |
 *   v
 * ACTIVE
 *   |
 *   v
 * ARCHIVED
 *
 * OUT_OF_STOCK is used when inventory is empty.
 * ------------------------------------------------------------------------
 */

export enum ProductStatus {
  /**
   * Product created but not visible.
   */
  DRAFT = 'draft',

  /**
   * Product available for customers.
   */
  ACTIVE = 'active',

  /**
   * Product temporarily unavailable.
   */
  OUT_OF_STOCK = 'out_of_stock',

  /**
   * Product removed from marketplace.
   */
  ARCHIVED = 'archived',
}
