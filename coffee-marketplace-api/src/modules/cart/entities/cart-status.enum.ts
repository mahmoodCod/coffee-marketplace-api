/**
 * Represents the lifecycle status of a shopping cart.
 *
 * ACTIVE:
 * The cart is currently available for the customer to use.
 *
 * COMPLETED:
 * The cart has been converted into an order.
 *
 * ABANDONED:
 * The cart is no longer active and will not be used.
 */
export enum CartStatus {
  ACTIVE = 'ACTIVE',

  COMPLETED = 'COMPLETED',

  ABANDONED = 'ABANDONED',
}
