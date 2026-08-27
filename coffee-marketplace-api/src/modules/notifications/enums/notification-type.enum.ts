/**
 * ------------------------------------------------------------------------
 * Notification Type
 * ------------------------------------------------------------------------
 *
 * Defines the available notification types.
 *
 * Used to identify the reason
 * a notification was created.
 * ------------------------------------------------------------------------
 */
export enum NotificationType {
  REGISTRATION = 'REGISTRATION',

  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',

  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
}
