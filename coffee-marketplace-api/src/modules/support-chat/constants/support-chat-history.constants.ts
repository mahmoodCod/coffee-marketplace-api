/**
 * ------------------------------------------------------------------------
 * Support Chat History Constants
 * ------------------------------------------------------------------------
 *
 * Controls how conversation history and product context are stored in Redis.
 * ------------------------------------------------------------------------
 */

/**
 * Redis key prefix for support chat conversation sessions.
 */
export const SUPPORT_CHAT_HISTORY_KEY_PREFIX = 'support-chat:session:';

/**
 * Redis key prefix for referenced product IDs in a support chat session.
 */
export const SUPPORT_CHAT_PRODUCT_CONTEXT_KEY_PREFIX =
  'support-chat:product-context:';

/**
 * Conversation history and product context expire after 24 hours of inactivity.
 */
export const SUPPORT_CHAT_HISTORY_TTL_SECONDS = 60 * 60 * 24;

/**
 * Keep only the newest messages to protect the AI context window.
 */
export const SUPPORT_CHAT_HISTORY_MAX_MESSAGES = 20;
