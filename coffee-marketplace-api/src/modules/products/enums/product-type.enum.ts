/**
 * ------------------------------------------------------------------------
 * Product Type Enum
 * ------------------------------------------------------------------------
 *
 * Defines available product categories/types
 * inside coffee marketplace.
 *
 * Examples:
 * - Coffee products
 * - Equipment
 * - Accessories
 *
 * This prevents invalid values from being stored
 * in product_type column.
 * ------------------------------------------------------------------------
 */

export enum ProductType {
  /**
   * Coffee products.
   */
  COFFEE = 'coffee',

  /**
   * Coffee making equipment.
   */
  EQUIPMENT = 'equipment',

  /**
   * Coffee related accessories.
   */
  ACCESSORY = 'accessory',
}
