import { Controller, Get, Query } from '@nestjs/common';

import { ReportService } from '../services/report.service';

import { AdminOrderReportResponseDto } from '../dto/admin-order-report-response.dto';
import { AdminProductReportResponseDto } from '../dto/admin-product-report-response.dto';
import { AdminUserReportResponseDto } from '../dto/admin-user-report-response.dto';

import { OrderStatus } from '../../orders/enums/order-status.enum';
import { ProductStatus } from '../../products/enums/product-status.enum';
import { UserStatus } from '../../users/enums/user-status.enum';
import type { SystemRole } from 'src/common/constants/system-roles.constant';

@Controller('admin/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * Returns a paginated operational report of platform orders.
   *
   * Administrators can optionally filter the report by creation date
   * and order status. The controller only converts HTTP query values
   * into the types expected by the report service.
   */
  @Get('orders')
  async getAdminOrderReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: OrderStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<AdminOrderReportResponseDto> {
    return this.reportService.getAdminOrderReport(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      status,
      Number(page),
      Number(limit),
    );
  }

  /**
   * Returns a paginated operational report of platform products.
   *
   * Administrators can filter products by their current lifecycle status.
   */
  @Get('products')
  async getAdminProductReport(
    @Query('status') status?: ProductStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<AdminProductReportResponseDto> {
    return this.reportService.getAdminProductReport(
      status,
      Number(page),
      Number(limit),
    );
  }

  /**
   * Returns a paginated operational report of platform users.
   *
   * Administrators can filter users by account status and assigned role.
   */
  @Get('users')
  async getAdminUserReport(
    @Query('status') status?: UserStatus,
    @Query('role') role?: SystemRole,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<AdminUserReportResponseDto> {
    return this.reportService.getAdminUserReport(
      status,
      role,
      Number(page),
      Number(limit),
    );
  }
}
