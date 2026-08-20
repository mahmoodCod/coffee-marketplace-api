import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Address } from '../entities/address.entity';

/**
 * ------------------------------------------------------------------------
 * Addresses Repository
 * ------------------------------------------------------------------------
 *
 * Database access for Address entities.
 * Ownership checks belong in UsersService.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class AddressesRepository {
  constructor(
    @InjectRepository(Address)
    private readonly repository: Repository<Address>,
  ) {}

  /**
   * Returns every address for a given user.
   */
  async findByUserId(userId: string): Promise<Address[]> {
    return this.repository.find({
      where: {
        user: {
          id: userId,
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  /**
   * Finds one address by id (without ownership filter).
   */
  async findById(id: string): Promise<Address | null> {
    return this.repository.findOne({
      where: {
        id,
      },
      relations: ['user'],
    });
  }

  /**
   * Finds one address that belongs to a specific user.
   */
  async findByIdForUser(id: string, userId: string): Promise<Address | null> {
    return this.repository.findOne({
      where: {
        id,
        user: {
          id: userId,
        },
      },
    });
  }

  /**
   * Find an address belonging to a specific user.
   *
   * This method scopes the address lookup to the user
   * to prevent one user from accessing another user's address.
   */
  async findByIdAndUserId(
    addressId: string,
    userId: string,
  ): Promise<Address | null> {
    return this.repository.findOne({
      where: {
        id: addressId,
        user: {
          id: userId,
        },
      },
    });
  }
  async create(payload: Partial<Address>): Promise<Address> {
    const address = this.repository.create(payload);

    return this.repository.save(address);
  }

  async save(address: Address): Promise<Address> {
    return this.repository.save(address);
  }

  async remove(address: Address): Promise<Address> {
    return this.repository.remove(address);
  }
}
