import { randomUUID } from 'node:crypto';
import { ConversationOwner } from '../../models/conversation-owner.model';
import { ConversationRepository } from '../../repositories/conversation.repository';
import { Conversation } from '../../entities/conversation.entity';

/**
 * Defines the input required to create a conversation.
 */
export interface CreateConversationCommand {
  /** Owner of the new conversation. */
  owner: ConversationOwner;

  /** Conversation lifetime in seconds. */
  ttlSeconds: number;
}

/**
 * Creates a new conversation.
 *
 * This use case coordinates conversation creation
 * and persistence without depending on a specific database.
 */
export class CreateConversationUseCase {
  constructor(
    private readonly conversationRepository: ConversationRepository,
  ) {}

  /**
   * Executes the conversation creation process.
   */
  async execute(command: CreateConversationCommand): Promise<Conversation> {
    // Validate the conversation lifetime before creating the entity.
    if (!Number.isInteger(command.ttlSeconds) || command.ttlSeconds <= 0) {
      throw new Error('Conversation TTL must be a positive integer.');
    }

    const now = new Date();

    // Generate a unique identifier for the new conversation.
    const conversationId = randomUUID();

    // Calculate the expiration timestamp using the configured TTL.
    const expiresAt = new Date(now.getTime() + command.ttlSeconds * 1000);

    // Create the conversation through its domain factory.
    const conversation = Conversation.create({
      id: conversationId,
      owner: command.owner,
      createdAt: now,
      expiresAt,
    });

    // Persist the conversation using the repository contract.
    await this.conversationRepository.create(conversation);

    return conversation;
  }
}
