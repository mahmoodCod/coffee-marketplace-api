import { OrderStatus } from '../../orders/enums/order-status.enum';

export class SellerOrderReportItemDto {
  /**
   * Unique identifier of the order containing the seller's products.
   */
  orderId: string;

  /**
   * Identifier of the customer who placed the order.
   */
  customerId: string;

  /**
   * Display name of the customer who placed the order.
   */
  customerName: string | null;

  /**
   * Current lifecycle status of the order.
   */
  status: OrderStatus;

  /**
   * Order items that belong specifically to the authenticated seller.
   *
   * A single order may contain products from multiple sellers, so only
   * the items owned by the current seller are included in this report.
   */
  items: SellerOrderReportItemProductDto[];

  /**
   * Total value of the authenticated seller's items in this order.
   *
   * This is calculated from the seller's own order items rather than
   * using the complete Order.finalPrice.
   */
  sellerSubtotal: string;

  /**
   * Date and time when the order was created.
   */
  createdAt: string;
}

export class SellerOrderReportItemProductDto {
  /**
   * Unique identifier of the seller's product.
   */
  productId: string;

  /**
   * Display name of the seller's product.
   */
  productName: string;

  /**
   * Quantity of this product included in the order.
   */
  quantity: number;

  /**
   * Product price captured when the order item was created.
   */
  unitPrice: string;
}
