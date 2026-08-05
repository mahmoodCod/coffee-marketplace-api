import { Injectable, ForbiddenException } from '@nestjs/common';

import { UsersService } from '../../users/services/user.service';

import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import { SellerProfileResponseDto, UpdateSellerProfileDto } from '../dto';

/**
 * ------------------------------------------------------------------------
 * Seller Service
 * ------------------------------------------------------------------------
 *
 * Business logic for seller endpoints.
 *
 * Responsibilities:
 * - Return seller profile
 * - Update seller profile (future)
 * - List seller products (future)
 * - List seller orders (future)
 * - Seller reports (future)
 *
 * Notes:
 * Seller is NOT a separate entity.
 *
 * Seller = User with role "seller".
 * ------------------------------------------------------------------------
 */
@Injectable()
export class SellerService {
  constructor(private readonly usersService: UsersService) {}

  /**
   * ------------------------------------------------------------------------
   * Get Seller Profile
   * ------------------------------------------------------------------------
   *
   * Returns the authenticated seller profile.
   *
   * Business Rule:
   * Only sellers may access seller endpoints.
   * ------------------------------------------------------------------------
   */
  async getProfile(currentUser: JwtPayload): Promise<SellerProfileResponseDto> {
    /**
     * Reject non-seller users.
     */
    if (currentUser.role !== SYSTEM_ROLES.SELLER) {
      throw new ForbiddenException('Only sellers can access this resource.');
    }

    /**
     * Load seller from Users module.
     */
    const seller = await this.usersService.findById(currentUser.sub);

    /**
     * Convert entity to response DTO.
     */
    return {
      id: seller.id,

      name: seller.name,

      phone: seller.phone,

      role: seller.role.name,

      createdAt: seller.createdAt,

      updatedAt: seller.updatedAt,
    };
  }

  /**
   * ------------------------------------------------------------------------
   * Update Seller Profile
   * ------------------------------------------------------------------------
   *
   * Updates the authenticated seller profile.
   *
   * Business Rule:
   * Only sellers may update their profile.
   * ------------------------------------------------------------------------
   */
  async updateProfile(
    currentUser: JwtPayload,
    dto: UpdateSellerProfileDto,
  ): Promise<SellerProfileResponseDto> {
    /**
     * Reject non-seller users.
     */
    if (currentUser.role !== SYSTEM_ROLES.SELLER) {
      throw new ForbiddenException('Only sellers can access this resource.');
    }

    /**
     * Load seller.
     */
    const seller = await this.usersService.findById(currentUser.sub);

    /**
     * Update editable fields.
     */
    if (dto.name !== undefined) {
      seller.name = dto.name.trim() === '' ? null : dto.name.trim();
    }

    /**
     * Save changes.
     */
    const updated = await this.usersService.save(seller);

    /**
     * Convert entity to response DTO.
     */
    return {
      id: updated.id,

      name: updated.name,

      phone: updated.phone,

      role: updated.role.name,

      createdAt: updated.createdAt,

      updatedAt: updated.updatedAt,
    };
  }
}
