import { ProductStatus } from '../../products/enums/product-status.enum';

export class AdminProductReportItemDto {
  /**
   * Unique identifier of the product.
   */
  productId: string;

  /**
   * Display name of the product.
   */
  name: string;

  /**
   * Identifier of the seller who owns the product.
   */
  sellerId: string;

  /**
   * Display name of the seller who owns the product.
   */
  sellerName: string | null;

  /**
   * Current lifecycle status of the product.
   */
  status: ProductStatus;

  /**
   * Current selling price of the product.
   */
  price: string;

  /**
   * Total physical stock currently recorded for the product.
   */
  stock: number;

  /**
   * Quantity currently reserved by active orders.
   */
  reservedStock: number;

  /**
   * Quantity currently available for purchase.
   *
   * This is calculated as stock minus reserved stock.
   */
  availableStock: number;

  /**
   * Date and time when the product was created.
   */
  createdAt: string;
}
