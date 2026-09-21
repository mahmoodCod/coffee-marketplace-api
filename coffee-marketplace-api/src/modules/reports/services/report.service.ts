import { Injectable } from '@nestjs/common';

import { ReportRepository } from '../repositories/report.repository';

import { AdminOrderReportResponseDto } from '../dto/admin-order-report-response.dto';
import { AdminProductReportResponseDto } from '../dto/admin-product-report-response.dto';
import { AdminUserReportResponseDto } from '../dto/admin-user-report-response.dto';
import { SellerOrderReportResponseDto } from '../dto/seller-order-report-response.dto';
import { SellerProductSalesReportResponseDto } from '../dto/seller-product-sales-report-response.dto';

import { OrderStatus } from '../../orders/enums/order-status.enum';
import { ProductStatus } from '../../products/enums/product-status.enum';
import { SystemRole } from '../../../common/constants/system-roles.constant';
import { UserStatus } from '../../users/enums/user-status.enum';

@Injectable()
export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) {}

  /**
   * Normalizes pagination so report callers always receive safe values.
   */
  private normalizePagination(
    page = 1,
    limit = 20,
  ): { page: number; limit: number } {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
    const safeLimit =
      Number.isFinite(limit) && limit > 0
        ? Math.min(100, Math.floor(limit))
        : 20;

    return { page: safePage, limit: safeLimit };
  }

  /**
   * Returns a paginated list of orders for the administrator report.
   *
   * The report exposes customer, order, and payment information and
   * supports optional date-range and status filters.
   *
   * This method only transforms repository results into the API response
   * format and never modifies order data.
   */
  async getAdminOrderReport(
    from?: Date,
    to?: Date,
    status?: OrderStatus,
    page = 1,
    limit = 20,
  ): Promise<AdminOrderReportResponseDto> {
    const pagination = this.normalizePagination(page, limit);

    const result = await this.reportRepository.getAdminOrderReport(
      from,
      to,
      status,
      pagination.page,
      pagination.limit,
    );

    return {
      data: result.orders.map((order) => ({
        orderId: order.id,
        customerId: order.user.id,
        customerName: order.user.name ?? null,
        status: order.status,
        totalPrice: order.totalPrice,
        finalPrice: order.finalPrice,
        paymentStatus: order.payment?.status ?? null,
        createdAt: order.createdAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Returns a paginated list of products for the administrator report.
   *
   * The report includes seller and inventory information so administrators
   * can inspect the current operational state of each product.
   *
   * Available stock is calculated from physical stock minus reserved stock.
   */
  async getAdminProductReport(
    status?: ProductStatus,
    page = 1,
    limit = 20,
  ): Promise<AdminProductReportResponseDto> {
    const pagination = this.normalizePagination(page, limit);

    const result = await this.reportRepository.getAdminProductReport(
      status,
      pagination.page,
      pagination.limit,
    );

    return {
      data: result.products.map((product) => ({
        productId: product.id,
        name: product.title,
        sellerId: product.seller.id,
        sellerName: product.seller.name ?? null,
        status: product.status,
        price: product.price,
        stock: product.inventory?.stock ?? 0,
        reservedStock: product.inventory?.reservedStock ?? 0,
        availableStock:
          (product.inventory?.stock ?? 0) -
          (product.inventory?.reservedStock ?? 0),
        createdAt: product.createdAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Returns a paginated list of users for the administrator report.
   *
   * The report exposes operational user information such as role and
   * account status. Optional filters allow administrators to inspect
   * only users matching a specific role or account status.
   *
   * This method only reads existing user data and never modifies it.
   */
  async getAdminUserReport(
    status?: UserStatus,
    role?: SystemRole,
    page = 1,
    limit = 20,
  ): Promise<AdminUserReportResponseDto> {
    const pagination = this.normalizePagination(page, limit);

    const result = await this.reportRepository.getAdminUserReport(
      status,
      role,
      pagination.page,
      pagination.limit,
    );

    return {
      data: result.users.map((user) => ({
        userId: user.id,
        name: user.name ?? null,
        phone: user.phone,
        role: user.role.name,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Returns a paginated list of orders related to the authenticated seller.
   *
   * A single order may contain products from multiple sellers, therefore
   * the report must expose only the order items belonging to this seller.
   *
   * Seller revenue is calculated from the historical order-item prices
   * instead of the full order final price.
   */
  async getSellerOrderReport(
    sellerId: string,
    from?: Date,
    to?: Date,
    status?: OrderStatus,
    page = 1,
    limit = 20,
  ): Promise<SellerOrderReportResponseDto> {
    const pagination = this.normalizePagination(page, limit);

    const result = await this.reportRepository.getSellerOrderReport(
      sellerId,
      from,
      to,
      status,
      pagination.page,
      pagination.limit,
    );

    return {
      data: result.orders.map((order) => {
        /**
         * Keep only the products that belong to the current seller.
         *
         * This prevents products owned by other sellers from being exposed
         * when an order contains items from multiple sellers.
         */
        const sellerItems = order.items.filter(
          (item) => item.product.seller.id === sellerId,
        );

        /**
         * Calculate the seller's subtotal from historical order-item prices.
         *
         * The order final price cannot be used because it may include items
         * belonging to other sellers.
         */
        const sellerSubtotal = sellerItems.reduce(
          (total, item) => total + Number(item.unitPrice) * item.quantity,
          0,
        );

        return {
          orderId: order.id,
          customerId: order.user.id,
          customerName: order.user.name ?? null,
          status: order.status,
          items: sellerItems.map((item) => ({
            productId: item.product.id,
            productName: item.product.title,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          sellerSubtotal: sellerSubtotal.toString(),
          createdAt: order.createdAt.toISOString(),
        };
      }),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Returns a paginated sales report for products owned by the seller.
   *
   * Sales are based on paid orders and historical OrderItem prices so that
   * previous sales remain accurate even when the current product price changes.
   */
  async getSellerProductSalesReport(
    sellerId: string,
    from?: Date,
    to?: Date,
    page = 1,
    limit = 20,
  ): Promise<SellerProductSalesReportResponseDto> {
    const pagination = this.normalizePagination(page, limit);

    const result = await this.reportRepository.getSellerProductSalesReport(
      sellerId,
      from,
      to,
      pagination.page,
      pagination.limit,
    );

    return {
      data: result.products.map((product) => ({
        productId: product.productId,
        productName: product.productName,
        productStatus: product.productStatus,
        unitPrice: product.unitPrice,
        totalQuantitySold: Number(product.totalQuantitySold),
        totalRevenue: product.totalRevenue,
        createdAt: new Date(product.createdAt).toISOString(),
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
