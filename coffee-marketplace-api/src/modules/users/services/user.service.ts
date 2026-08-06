import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UsersRepository } from '../repositories/users.repository';
import { AddressesRepository } from '../repositories/addresses.repository';

import { User } from '../entities/user.entity';
import { Address } from '../entities/address.entity';

import {
  AddressResponseDto,
  CreateAddressDto,
  UpdateAddressDto,
  UpdateProfileDto,
  UserResponseDto,
} from '../dto';

/**
 * ------------------------------------------------------------------------
 * Users Service
 * ------------------------------------------------------------------------
 *
 * Business logic for the Users module (profile + addresses).
 *
 * Architecture responsibilities:
 *   - Get / update current user profile
 *   - Manage user addresses
 *
 * Authentication (OTP / JWT) belongs to Auth module.
 * Database queries are delegated to repositories.
 * ------------------------------------------------------------------------
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly addressesRepository: AddressesRepository,
  ) {}

  /**
   * Finds a user by UUID.
   * Throws NotFoundException when missing.
   */
  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id "${id}" was not found.`);
    }

    return user;
  }

  /**
   * Finds a user by phone.
   * Returns null when not found (Auth decides how to react).
   */
  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findByPhone(phone);
  }

  /**
   * ------------------------------------------------------------------------
   * Save User
   * ------------------------------------------------------------------------
   *
   * Persists changes to an existing user.
   *
   * This method is intended for internal module communication,
   * allowing other modules (e.g. Seller) to update User data
   * without accessing the repository directly.
   * ------------------------------------------------------------------------
   */
  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  /**
   * GET /users/profile
   * Returns the authenticated user's profile.
   */
  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.findById(userId);

    return this.toUserResponse(user);
  }

  /**
   * PATCH /users/profile
   * Updates allowed profile fields for the authenticated user.
   */
  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    const user = await this.findById(userId);

    if (dto.name !== undefined) {
      user.name = dto.name.trim() === '' ? null : dto.name.trim();
    }

    const saved = await this.usersRepository.save(user);

    return this.toUserResponse(saved);
  }

  /**
   * GET /users/addresses
   */
  async getAddresses(userId: string): Promise<AddressResponseDto[]> {
    await this.findById(userId);

    const addresses = await this.addressesRepository.findByUserId(userId);

    return addresses.map((address) => this.toAddressResponse(address));
  }

  /**
   * POST /users/addresses
   */
  async createAddress(
    userId: string,
    dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    const user = await this.findById(userId);

    const address = await this.addressesRepository.create({
      user,
      title: dto.title,
      province: dto.province,
      city: dto.city,
      street: dto.street,
      postalCode: dto.postalCode,
    });

    return this.toAddressResponse(address);
  }

  /**
   * PATCH /users/addresses/:id
   */
  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    const address = await this.getOwnedAddress(userId, addressId);

    if (dto.title !== undefined) {
      address.title = dto.title;
    }

    if (dto.province !== undefined) {
      address.province = dto.province;
    }

    if (dto.city !== undefined) {
      address.city = dto.city;
    }

    if (dto.street !== undefined) {
      address.street = dto.street;
    }

    if (dto.postalCode !== undefined) {
      address.postalCode = dto.postalCode;
    }

    const saved = await this.addressesRepository.save(address);

    return this.toAddressResponse(saved);
  }

  /**
   * DELETE /users/addresses/:id
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.getOwnedAddress(userId, addressId);

    await this.addressesRepository.remove(address);
  }

  /**
   * Loads an address and ensures it belongs to userId.
   */
  private async getOwnedAddress(
    userId: string,
    addressId: string,
  ): Promise<Address> {
    const address = await this.addressesRepository.findByIdForUser(
      addressId,
      userId,
    );

    if (!address) {
      const exists = await this.addressesRepository.findById(addressId);

      if (!exists) {
        throw new NotFoundException(
          `Address with id "${addressId}" was not found.`,
        );
      }

      throw new ForbiddenException('You cannot access this address.');
    }

    return address;
  }

  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      status: user.status,
      role: user.role.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private toAddressResponse(address: Address): AddressResponseDto {
    return {
      id: address.id,
      title: address.title,
      province: address.province,
      city: address.city,
      street: address.street,
      postalCode: address.postalCode,
      createdAt: address.createdAt,
      updatedAt: address.updatedAt,
    };
  }
}
