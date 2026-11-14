import { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import { ConversationRepository } from '../../../domain/repositories/conversation.repository';

/**
 * Defines the input required to refresh conversation expiration.
 */
export interface RefreshConversationExpirationCommand {
  /** Conversation whose expiration will be extended. */
  conversationId: string;

  /** Identity of the user or guest requesting the refresh. */
  requester: ConversationOwner;

  /** New conversation lifetime in seconds. */
  ttlSeconds: number;
}

/**
 * Refreshes the expiration time of an existing conversation.
 *
 * Only the conversation owner can extend its lifetime.
 * Expired or closed conversations cannot be refreshed.
 */
export class RefreshConversationExpirationUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  /**
   * Executes the conversation expiration refresh process.
   */
  async execute(command: RefreshConversationExpirationCommand): Promise<void> {
    // Validate the conversation identifier.
    if (!command.conversationId?.trim()) {
      throw new Error('Conversation ID is required.');
    }

    // Validate the requester identity.
    if (!command.requester?.id?.trim()) {
      throw new Error('Requester identity is required.');
    }

    if (!['guest', 'user'].includes(command.requester.type)) {
      throw new Error('Invalid requester type.');
    }

    // Validate the requested conversation lifetime.
    if (!Number.isInteger(command.ttlSeconds) || command.ttlSeconds <= 0) {
      throw new Error('TTL must be a positive integer.');
    }

    // Retrieve the conversation before refreshing its expiration.
    const conversation = await this.conversationRepository.findById(
      command.conversationId,
    );

    if (!conversation) {
      throw new Error('Conversation not found.');
    }

    // Verify that the requester owns the conversation.
    const owner = conversation.owner;

    if (
      owner.type !== command.requester.type ||
      owner.id !== command.requester.id
    ) {
      throw new Error('Access to this conversation is denied.');
    }

    // Apply the sliding expiration policy through the domain entity.
    conversation.refreshExpiration(command.ttlSeconds);

    // Persist the updated expiration timestamp.
    await this.conversationRepository.save(conversation);
  }
}
