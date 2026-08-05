import { Injectable, ForbiddenException } from '@nestjs/common';

import { UsersService } from '../../users/services/user.service';

import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import { SellerProfileResponseDto } from '../dto';

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
}
