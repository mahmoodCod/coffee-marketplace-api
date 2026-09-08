import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { DashboardService } from '../services/dashboard.service';
import { SellerDashboardResponseDto } from '../dto/seller-dashboard-response.dto';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

/**
 * ------------------------------------------------------------------------
 * Seller Dashboard Controller
 * ------------------------------------------------------------------------
 *
 * Handles read-only dashboard analytics for sellers.
 *
 * The seller ID is taken from the authenticated JWT payload.
 * This prevents a seller from requesting another seller's metrics.
 * ------------------------------------------------------------------------
 */
@ApiTags('Seller Dashboard')
@ApiBearerAuth()
@Controller('seller/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.SELLER)
export class SellerDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Returns dashboard statistics belonging only to the authenticated seller.
   *
   * The seller ID is taken from the JWT-authenticated user instead of a
   * request parameter. This prevents a seller from requesting another
   * seller's products, orders, revenue, or inventory statistics.
   */
  @Get()
  @ApiOperation({
    summary: 'Get seller dashboard statistics',
  })
  @ApiOkResponse({
    type: SellerDashboardResponseDto,
  })
  async getDashboard(
    @CurrentUser() user: JwtPayload,
  ): Promise<SellerDashboardResponseDto> {
    return this.dashboardService.getSellerDashboard(user.sub);
  }
}
