import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ReportService } from '../services/report.service';

import { AdminOrderReportResponseDto } from '../dto/admin-order-report-response.dto';
import { AdminProductReportResponseDto } from '../dto/admin-product-report-response.dto';
import { AdminUserReportResponseDto } from '../dto/admin-user-report-response.dto';
import {
  AdminProductReportQueryDto,
  AdminUserReportQueryDto,
  OrderReportQueryDto,
} from '../dto/report-query.dto';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

/**
 * ------------------------------------------------------------------------
 * Admin Report Controller
 * ------------------------------------------------------------------------
 *
 * Handles read-only operational reports for administrators.
 * ------------------------------------------------------------------------
 */
@ApiTags('Admin Reports')
@ApiBearerAuth()
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.ADMIN)
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
  @ApiOperation({ summary: 'Get admin order report' })
  @ApiOkResponse({ type: AdminOrderReportResponseDto })
  async getAdminOrderReport(
    @Query() query: OrderReportQueryDto,
  ): Promise<AdminOrderReportResponseDto> {
    return this.reportService.getAdminOrderReport(
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
      query.status,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  /**
   * Returns a paginated operational report of platform products.
   *
   * Administrators can filter products by their current lifecycle status.
   */
  @Get('products')
  @ApiOperation({ summary: 'Get admin product report' })
  @ApiOkResponse({ type: AdminProductReportResponseDto })
  async getAdminProductReport(
    @Query() query: AdminProductReportQueryDto,
  ): Promise<AdminProductReportResponseDto> {
    return this.reportService.getAdminProductReport(
      query.status,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  /**
   * Returns a paginated operational report of platform users.
   *
   * Administrators can filter users by account status and assigned role.
   */
  @Get('users')
  @ApiOperation({ summary: 'Get admin user report' })
  @ApiOkResponse({ type: AdminUserReportResponseDto })
  async getAdminUserReport(
    @Query() query: AdminUserReportQueryDto,
  ): Promise<AdminUserReportResponseDto> {
    return this.reportService.getAdminUserReport(
      query.status,
      query.role,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }
}
