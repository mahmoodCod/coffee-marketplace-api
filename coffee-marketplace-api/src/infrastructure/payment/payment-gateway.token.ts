/**
 * Payment Gateway Injection Token
 *
 * Used to inject a payment gateway implementation
 * into application services.
 *
 * Interfaces do not exist at runtime in TypeScript,
 * so NestJS requires a runtime token for dependency injection.
 */
export const PAYMENT_GATEWAY = Symbol('PAYMENT_GATEWAY');
