/**
 * ------------------------------------------------------------------------
 * Order Status Enum
 * ------------------------------------------------------------------------
 *
 * Controls order lifecycle from checkout through fulfillment.
 *
 * Order flow:
 *
 * PENDING_PAYMENT
 *   |
 *   v
 * PAID
 *   |
 *   v
 * SHIPPED
 *   |
 *   v
 * DELIVERED
 *
 * CANCELLED is allowed only before shipment.
 * ------------------------------------------------------------------------
 */
export enum OrderStatus {
  /**
   * The order was created from the cart and is awaiting payment.
   */
  PENDING_PAYMENT = 'PENDING_PAYMENT',

  /**
   * Payment was completed successfully.
   */
  PAID = 'PAID',

  /**
   * The order has been shipped by an administrator.
   */
  SHIPPED = 'SHIPPED',

  /**
   * The order has been delivered to the customer.
   */
  DELIVERED = 'DELIVERED',

  /**
   * The order was cancelled before shipment.
   */
  CANCELLED = 'CANCELLED',
}
