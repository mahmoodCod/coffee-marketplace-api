/**
 * Represents the lifecycle status of a payment.
 *
 * PENDING:
 * The payment has been created and is waiting for
 * the payment gateway result.
 *
 * SUCCESS:
 * The payment was completed successfully.
 * The related order can be marked as PAID.
 *
 * FAILED:
 * The payment attempt was unsuccessful.
 * The related order remains in PENDING_PAYMENT status.
 *
 * REFUNDED:
 * The successful payment amount has been returned
 * to the customer.
 *
 * CANCELLED:
 * The payment process was cancelled before
 * successful completion.
 */
export enum PaymentStatus {
  PENDING = 'PENDING',

  SUCCESS = 'SUCCESS',

  FAILED = 'FAILED',

  REFUNDED = 'REFUNDED',

  CANCELLED = 'CANCELLED',
}
