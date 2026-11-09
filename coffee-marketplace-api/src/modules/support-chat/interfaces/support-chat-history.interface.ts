/**
 * ------------------------------------------------------------------------
 * Support Chat History Message
 * ------------------------------------------------------------------------
 *
 * One message stored in Redis conversation history.
 * ------------------------------------------------------------------------
 */
export interface SupportChatHistoryMessage {
  /**
   * Message author role used by the AI chat API.
   */
  role: 'user' | 'assistant';

  /**
   * Original customer or chatbot message content.
   */
  content: string;
}
