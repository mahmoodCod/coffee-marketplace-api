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
 * Redis key prefix for the selected product in a support chat session.
 */
export const SUPPORT_CHAT_SELECTED_PRODUCT_KEY_PREFIX =
  'support-chat:selected-product:';

/**
 * Conversation history and product context expire after 24 hours of inactivity.
 */
export const SUPPORT_CHAT_HISTORY_TTL_SECONDS = 60 * 60 * 24;

/**
 * Guest identity remains valid for 30 days.
 */
export const SUPPORT_CHAT_GUEST_IDENTITY_TTL_SECONDS =
60 * 60 * 24 * 30;

/**
 * HTTP-only cookie name used to identify guest users.
 */
export const SUPPORT_CHAT_GUEST_COOKIE_NAME = 'support_chat_guest';

/**
 * Keep only the newest messages to protect the AI context window.
 */
export const SUPPORT_CHAT_HISTORY_MAX_MESSAGES = 20;
