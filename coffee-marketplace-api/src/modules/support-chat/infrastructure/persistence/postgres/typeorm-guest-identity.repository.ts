import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GuestIdentity } from '../../../domain/entities/guest-identity.entity';
import { GuestIdentityRepository } from '../../../domain/repositories/guest-identity.repository';
import { GuestIdentityOrmEntity } from './guest-identity.orm-entity';

/**
 * ------------------------------------------------------------------------
 * TypeORM Guest Identity Repository
 * ------------------------------------------------------------------------
 *
 * Persists guest identities in PostgreSQL.
 *
 * Security:
 * - Only token hashes are stored.
 * - Raw guest tokens must never reach this repository.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class TypeOrmGuestIdentityRepository implements GuestIdentityRepository {
  constructor(
    @InjectRepository(GuestIdentityOrmEntity)
    private readonly repository: Repository<GuestIdentityOrmEntity>,
  ) {}

  /**
   * Creates a guest identity record.
   */
  async create(guestIdentity: GuestIdentity): Promise<void> {
    await this.repository.insert({
      id: guestIdentity.id,
      tokenHash: guestIdentity.tokenHash,
      createdAt: guestIdentity.createdAt,
      expiresAt: guestIdentity.expiresAt,
    });
  }

  /**
   * Finds a guest identity by its internal identifier.
   */
  async findById(id: string): Promise<GuestIdentity | null> {
    if (!id?.trim()) {
      return null;
    }

    const entity = await this.repository.findOne({
      where: { id: id.trim() },
    });

    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Finds a guest identity using its hashed authentication token.
   */
  async findByTokenHash(tokenHash: string): Promise<GuestIdentity | null> {
    if (!tokenHash?.trim()) {
      return null;
    }

    const entity = await this.repository.findOne({
      where: { tokenHash: tokenHash.trim() },
    });

    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Updates mutable guest identity data.
   *
   * The identity ID, token hash, and creation timestamp remain immutable.
   */
  async save(guestIdentity: GuestIdentity): Promise<void> {
    const result = await this.repository.update(
      { id: guestIdentity.id },
      { expiresAt: guestIdentity.expiresAt },
    );

    if (result.affected !== 1) {
      throw new Error(
        `Guest identity "${guestIdentity.id}" could not be updated.`,
      );
    }
  }

  /**
   * Deletes the guest identity database record.
   *
   * Related conversations and Redis data must be cleaned up by the
   * application lifecycle layer to keep cross-storage cleanup consistent.
   */
  async delete(id: string): Promise<void> {
    if (!id?.trim()) {
      return;
    }

    await this.repository.delete({ id: id.trim() });
  }

  /**
   * Reconstructs the domain entity from its persisted representation.
   */
  private toDomain(entity: GuestIdentityOrmEntity): GuestIdentity {
    return GuestIdentity.create({
      id: entity.id,
      tokenHash: entity.tokenHash,
      createdAt: entity.createdAt,
      expiresAt: entity.expiresAt,
    });
  }
}
