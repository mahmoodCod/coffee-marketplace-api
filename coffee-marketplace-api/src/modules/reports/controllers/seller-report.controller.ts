import { Controller, Get, Query } from '@nestjs/common';

import { ReportService } from '../services/report.service';

import { SellerOrderReportResponseDto } from '../dto/seller-order-report-response.dto';
import { SellerProductSalesReportResponseDto } from '../dto/seller-product-sales-report-response.dto';

import { OrderStatus } from '../../orders/enums/order-status.enum';
import { User } from '../../users/entities/user.entity';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('seller/reports')
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
  async getSellerOrderReport(
    @CurrentUser() user: User,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: OrderStatus,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<SellerOrderReportResponseDto> {
    return this.reportService.getSellerOrderReport(
      user.id,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      status,
      Number(page),
      Number(limit),
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
  async getSellerProductSalesReport(
    @CurrentUser() user: User,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<SellerProductSalesReportResponseDto> {
    return this.reportService.getSellerProductSalesReport(
      user.id,
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
      Number(page),
      Number(limit),
    );
  }
}
