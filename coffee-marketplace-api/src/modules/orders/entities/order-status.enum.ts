/**
 * Represents the lifecycle status of an order.
 *
 * PENDING_PAYMENT:
 * The order was created from the cart and is awaiting payment.
 *
 * PAID:
 * Payment was completed successfully.
 *
 * SHIPPED:
 * The order has been shipped by an administrator.
 *
 * DELIVERED:
 * The order has been delivered to the customer.
 *
 * CANCELLED:
 * The order was cancelled before shipment.
 */
export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',

  PAID = 'PAID',

  SHIPPED = 'SHIPPED',

  DELIVERED = 'DELIVERED',

  CANCELLED = 'CANCELLED',
}
