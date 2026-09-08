import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { DashboardService } from '../services/dashboard.service';
import { AdminStatisticsResponseDto } from '../dto/admin-statistics-response.dto';
import { AdminSalesResponseDto } from '../dto/admin-sales-response.dto';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

/**
 * Handles read-only analytics endpoints for administrators.
 *
 * The controller is responsible for HTTP concerns such as
 * route definitions, query parameters, and access control.
 *
 * Business calculations and database queries are delegated
 * to DashboardService.
 */
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.ADMIN)
export class AdminDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Returns overall statistics for the admin dashboard.
   *
   * This endpoint is restricted to administrators.
   */
  @Get('statistics')
  async getStatistics(): Promise<AdminStatisticsResponseDto> {
    return this.dashboardService.getAdminStatistics();
  }

  /**
   * Returns aggregated sales data for the admin dashboard.
   *
   * from and to are optional date filters.
   * groupBy controls whether sales are grouped by day or month.
   */
  @Get('sales')
  async getSales(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy: 'day' | 'month' = 'day',
  ): Promise<AdminSalesResponseDto> {
    return this.dashboardService.getAdminSales(from, to, groupBy);
  }
}
