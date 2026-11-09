/**
 * ------------------------------------------------------------------------
 * Support Chat History Constants
 * ------------------------------------------------------------------------
 *
 * Controls how conversation history is stored in Redis.
 * ------------------------------------------------------------------------
 */

/**
 * Redis key prefix for support chat conversation sessions.
 */
export const SUPPORT_CHAT_HISTORY_KEY_PREFIX = 'support-chat:session:';

/**
 * Conversation history expires after 24 hours of inactivity.
 */
export const SUPPORT_CHAT_HISTORY_TTL_SECONDS = 60 * 60 * 24;

/**
 * Keep only the newest messages to protect the AI context window.
 */
export const SUPPORT_CHAT_HISTORY_MAX_MESSAGES = 20;
