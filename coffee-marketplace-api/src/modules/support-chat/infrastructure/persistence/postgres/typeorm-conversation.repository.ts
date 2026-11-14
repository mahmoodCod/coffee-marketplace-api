import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';

import { Conversation } from '../../../domain/entities/conversation.entity';
import type { ConversationOwner } from '../../../domain/models/conversation-owner.model';
import type { ConversationRepository } from '../../../domain/repositories/conversation.repository';
import { ConversationOrmEntity } from './conversation.orm-entity';

@Injectable()
export class TypeOrmConversationRepository implements ConversationRepository {
  constructor(
    @InjectRepository(ConversationOrmEntity)
    private readonly repository: Repository<ConversationOrmEntity>,
  ) {}

  /**
   * Creates a new conversation record.
   */
  async create(conversation: Conversation): Promise<void> {
    const entity = this.toOrmEntity(conversation);

    await this.repository.insert(entity);
  }

  /**
   * Finds a conversation by its identifier.
   */
  async findById(conversationId: string): Promise<Conversation | null> {
    if (!conversationId?.trim()) {
      throw new Error('Conversation ID must not be empty.');
    }

    const entity = await this.repository.findOne({
      where: { id: conversationId.trim() },
    });

    if (!entity) {
      return null;
    }

    return this.toDomain(entity);
  }

  /**
   * Updates an existing conversation without replacing its creation date.
   */
  async save(conversation: Conversation): Promise<void> {
    const entity = this.toOrmEntity(conversation);

    const result = await this.repository.update(
      { id: conversation.id },
      {
        ownerType: entity.ownerType,
        ownerId: entity.ownerId,
        status: entity.status,
        updatedAt: entity.updatedAt,
        expiresAt: entity.expiresAt,
      },
    );

    if (result.affected !== 1) {
      throw new Error('Conversation not found or could not be updated.');
    }
  }

  /**
   * Atomically transfers ownership using the expected current owner.
   *
   * Conditional database updates prevent concurrent requests
   * from transferring a conversation after its ownership has changed.
   */
  async transferOwnership(
    conversation: Conversation,
    expectedOwner: ConversationOwner,
  ): Promise<void> {
    const entity = this.toOrmEntity(conversation);

    const result = await this.repository.update(
      {
        id: conversation.id,
        ownerType: expectedOwner.type,
        ownerId: expectedOwner.id,
        status: 'active',
        expiresAt: MoreThan(new Date()),
      },
      {
        ownerType: entity.ownerType,
        ownerId: entity.ownerId,
        updatedAt: entity.updatedAt,
      },
    );

    if (result.affected !== 1) {
      throw new Error(
        'Conversation ownership transfer failed. The conversation may have changed or expired.',
      );
    }
  }

  /**
   * Deletes a conversation record.
   *
   * Related Redis data must be cleaned up by the application lifecycle layer.
   */
  async delete(conversationId: string): Promise<void> {
    if (!conversationId?.trim()) {
      throw new Error('Conversation ID must not be empty.');
    }

    const result = await this.repository.delete({
      id: conversationId.trim(),
    });

    if (result.affected !== 1) {
      throw new Error('Conversation not found or could not be deleted.');
    }
  }

  /**
   * Maps the domain aggregate to its ORM representation.
   */
  private toOrmEntity(conversation: Conversation): ConversationOrmEntity {
    const entity = new ConversationOrmEntity();

    entity.id = conversation.id;
    entity.ownerType = conversation.owner.type;
    entity.ownerId = conversation.owner.id;
    entity.status = conversation.status;
    entity.createdAt = new Date(conversation.createdAt);
    entity.updatedAt = conversation.updatedAt;
    entity.expiresAt = conversation.expiresAt;

    return entity;
  }

  /**
   * Reconstructs the domain aggregate from a database record.
   */
  private toDomain(entity: ConversationOrmEntity): Conversation {
    return Conversation.restore({
      id: entity.id,
      owner: {
        type: entity.ownerType,
        id: entity.ownerId,
      },
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      expiresAt: entity.expiresAt,
    });
  }
}
