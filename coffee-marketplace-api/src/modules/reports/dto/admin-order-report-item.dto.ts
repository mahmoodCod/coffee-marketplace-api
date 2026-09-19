import { OrderStatus } from '../../orders/enums/order-status.enum';
import { PaymentStatus } from '../../payments/enums/payment-status.enum';

export class AdminOrderReportItemDto {
  /**
   * Unique identifier of the order.
   */
  orderId: string;

  /**
   * Identifier of the customer who placed the order.
   */
  customerId: string;

  /**
   * Display name of the customer.
   */
  customerName: string | null;

  /**
   * Current lifecycle status of the order.
   */
  status: OrderStatus;

  /**
   * Original order amount before discounts.
   */
  totalPrice: string;

  /**
   * Final amount that the customer is expected to pay
   * after applicable discounts.
   */
  finalPrice: string;

  /**
   * Current payment status associated with the order.
   *
   * Keeping payment status in the report allows administrators
   * to distinguish between the order lifecycle and its payment state.
   *
   * Null when the order does not yet have a payment record.
   */
  paymentStatus: PaymentStatus | null;

  /**
   * Date and time when the order was created.
   */
  createdAt: string;
}
