import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { ReportService } from '../services/report.service';

import { SellerOrderReportResponseDto } from '../dto/seller-order-report-response.dto';
import { SellerProductSalesReportResponseDto } from '../dto/seller-product-sales-report-response.dto';
import {
  OrderReportQueryDto,
  ReportPaginationQueryDto,
} from '../dto/report-query.dto';

import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

/**
 * ------------------------------------------------------------------------
 * Seller Report Controller
 * ------------------------------------------------------------------------
 *
 * Handles read-only operational reports scoped to the authenticated seller.
 * ------------------------------------------------------------------------
 */
@ApiTags('Seller Reports')
@ApiBearerAuth()
@Controller('seller/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(SYSTEM_ROLES.SELLER)
export class SellerReportController {
  constructor(private readonly reportService: ReportService) {}

  /**
   * Returns a paginated report of orders containing products owned by
   * the authenticated seller.
   *
   * The seller identity is taken from the authenticated user instead of
   * accepting a seller ID from the client. This prevents a seller from
   * requesting another seller's operational report.
   */
  @Get('orders')
  @ApiOperation({ summary: 'Get seller order report' })
  @ApiOkResponse({ type: SellerOrderReportResponseDto })
  async getSellerOrderReport(
    @CurrentUser() user: JwtPayload,
    @Query() query: OrderReportQueryDto,
  ): Promise<SellerOrderReportResponseDto> {
    return this.reportService.getSellerOrderReport(
      user.sub,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
      query.status,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  /**
   * Returns a paginated sales report for products owned by the
   * authenticated seller.
   *
   * The seller identity is resolved from the authenticated user so the
   * client cannot manipulate the seller scope through query parameters.
   */
  @Get('products')
  @ApiOperation({ summary: 'Get seller product sales report' })
  @ApiOkResponse({ type: SellerProductSalesReportResponseDto })
  async getSellerProductSalesReport(
    @CurrentUser() user: JwtPayload,
    @Query() query: ReportPaginationQueryDto,
  ): Promise<SellerProductSalesReportResponseDto> {
    return this.reportService.getSellerProductSalesReport(
      user.sub,
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }
}
