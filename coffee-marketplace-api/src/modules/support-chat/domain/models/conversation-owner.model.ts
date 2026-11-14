
/**
 * Defines the supported ownership types for a conversation.
 *
 * - guest: A visitor who has not authenticated.
 * - user: An authenticated application user.
 */
export type ConversationOwnerType = 'guest' | 'user';

/**
 * Identifies the owner of a conversation.
 *
 * The ID must be an internal Guest Identity ID or User ID.
 * Raw guest tokens must never be used as owner IDs.
 */
export interface ConversationOwner {
  readonly type: ConversationOwnerType;
  readonly id: string;
}
