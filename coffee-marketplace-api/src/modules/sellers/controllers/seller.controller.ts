import { Controller, Get, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';

import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

import { SellerService } from '../services/seller.service';

import { SellerProfileResponseDto } from '../dto';

/**
 * ------------------------------------------------------------------------
 * Seller Controller
 * ------------------------------------------------------------------------
 *
 * Endpoints dedicated to authenticated sellers.
 *
 * Responsibilities:
 * - Seller profile
 * - Seller products (future)
 * - Seller orders (future)
 * - Seller reports (future)
 *
 * Every endpoint requires:
 *
 * - JWT Authentication
 * - Seller Role
 * ------------------------------------------------------------------------
 */

@ApiTags('Seller')
@ApiBearerAuth()
@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.SELLER)
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  /**
   * ------------------------------------------------------------------------
   * GET /seller/profile
   * ------------------------------------------------------------------------
   *
   * Returns the authenticated seller profile.
   * ------------------------------------------------------------------------
   */
  @Get('profile')
  @ApiOperation({
    summary: 'Get seller profile',
  })
  @ApiOkResponse({
    type: SellerProfileResponseDto,
  })
  async getProfile(
    @CurrentUser() currentUser: JwtPayload,
  ): Promise<SellerProfileResponseDto> {
    return this.sellerService.getProfile(currentUser);
  }
}
