import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { DashboardService } from '../services/dashboard.service';
import { SellerDashboardResponseDto } from '../dto/seller-dashboard-response.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

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
  async getDashboard(
    @Req() request: AuthenticatedRequest,
  ): Promise<SellerDashboardResponseDto> {
    return this.dashboardService.getSellerDashboard(request.user.id);
  }
}
