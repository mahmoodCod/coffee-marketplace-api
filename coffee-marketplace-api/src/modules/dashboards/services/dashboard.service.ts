import { Injectable } from '@nestjs/common';

import { DashboardRepository } from '../repositories/dashboard.repository';
import { AdminStatisticsResponseDto } from '../dto/admin-statistics-response.dto';
import { AdminSalesResponseDto } from '../dto/admin-sales-response.dto';
import { SellerDashboardResponseDto } from '../dto/seller-dashboard-response.dto';

/**
 * Coordinates dashboard analytics queries and maps their results
 * into the response DTOs exposed by the dashboard API.
 *
 * The service is intentionally read-only.
 * It does not create, update, or delete business entities.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  /**
   * Returns the overall statistics for the admin dashboard.
   *
   * Each metric is retrieved through a dedicated aggregate query.
   * This keeps the service focused on orchestration while the
   * repository remains responsible for database access.
   */
  async getAdminStatistics(): Promise<AdminStatisticsResponseDto> {
    const [
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalSuccessfulPayments,
      totalRevenue,
      pendingPaymentOrders,
      lowStockProducts,
    ] = await Promise.all([
      this.dashboardRepository.countUsers(),
      this.dashboardRepository.countSellers(),
      this.dashboardRepository.countProducts(),
      this.dashboardRepository.countOrders(),
      this.dashboardRepository.countSuccessfulPayments(),
      this.dashboardRepository.getTotalRevenue(),
      this.dashboardRepository.countPendingPaymentOrders(),
      this.dashboardRepository.countLowStockProducts(),
    ]);

    return {
      totalUsers,
      totalSellers,
      totalProducts,
      totalOrders,
      totalSuccessfulPayments,
      totalRevenue,
      pendingPaymentOrders,
      lowStockProducts,
    };
  }

  /**
   * Returns the sales analytics for the admin dashboard.
   *
   * The repository is responsible for grouping paid orders
   * by the requested period and calculating the aggregated values.
   */
  async getAdminSales(
    from?: string,
    to?: string,
    groupBy: 'day' | 'month' = 'day',
  ): Promise<AdminSalesResponseDto> {
    const data = this.dashboardRepository.getAdminSales(from, to, groupBy);

    return {
      groupBy,
      data,
    };
  }

  /**
   * Returns the dashboard statistics for the authenticated seller.
   *
   * All queries are scoped to the provided seller ID.
   * This prevents one seller from receiving another seller's
   * products, orders, revenue, or inventory statistics.
   */
  async getSellerDashboard(
    sellerId: string,
  ): Promise<SellerDashboardResponseDto> {
    const [
      ownProducts,
      ownOrders,
      ownPaidRevenue,
      ownPendingOrders,
      ownLowStockProducts,
    ] = await Promise.all([
      this.dashboardRepository.countSellerProducts(sellerId),
      this.dashboardRepository.countSellerOrders(sellerId),
      this.dashboardRepository.getSellerPaidRevenue(sellerId),
      this.dashboardRepository.countSellerPendingOrders(sellerId),
      this.dashboardRepository.countSellerLowStockProducts(sellerId),
    ]);

    return {
      ownProducts,
      ownOrders,
      ownPaidRevenue,
      ownPendingOrders,
      ownLowStockProducts,
    };
  }
}
