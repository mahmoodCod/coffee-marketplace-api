/**
 * ------------------------------------------------------------------------
 * Support Chat Dependency Injection Tokens
 * ------------------------------------------------------------------------
 *
 * TypeScript interfaces are removed at runtime.
 * These symbols provide runtime tokens for repository injection.
 * ------------------------------------------------------------------------
 */

export const SUPPORT_CHAT_TOKENS = {
  CONVERSATION_REPOSITORY: Symbol('CONVERSATION_REPOSITORY'),
  GUEST_IDENTITY_REPOSITORY: Symbol('GUEST_IDENTITY_REPOSITORY'),
  CONVERSATION_TURN_REPOSITORY: Symbol('CONVERSATION_TURN_REPOSITORY'),
  CONVERSATION_STATE_REPOSITORY: Symbol('CONVERSATION_STATE_REPOSITORY'),
  PRODUCT_REFERENCE_REPOSITORY: Symbol('PRODUCT_REFERENCE_REPOSITORY'),
} as const;
