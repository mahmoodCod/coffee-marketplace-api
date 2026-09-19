import { Test, TestingModule } from '@nestjs/testing';

import { ReportService } from '../services/report.service';
import { ReportRepository } from '../repositories/report.repository';

import { OrderStatus } from '../../orders/enums/order-status.enum';
import { ProductStatus } from '../../products/enums/product-status.enum';
import { UserStatus } from '../../users/enums/user-status.enum';

describe('ReportService', () => {
  let service: ReportService;
  let repository: {
    getAdminOrderReport: jest.Mock;
    getAdminProductReport: jest.Mock;
    getAdminUserReport: jest.Mock;
    getSellerOrderReport: jest.Mock;
    getSellerProductSalesReport: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      getAdminOrderReport: jest.fn(),
      getAdminProductReport: jest.fn(),
      getAdminUserReport: jest.fn(),
      getSellerOrderReport: jest.fn(),
      getSellerProductSalesReport: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportService,
        {
          provide: ReportRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<ReportService>(ReportService);
  });

  describe('getAdminOrderReport', () => {
    it('should map admin order report data correctly', async () => {
      /**
       * Arrange repository data with the same structure returned by the
       * order report repository query.
       */
      const createdAt = new Date('2026-01-10T10:00:00.000Z');

      repository.getAdminOrderReport.mockResolvedValue({
        orders: [
          {
            id: 'order-1',
            status: OrderStatus.PAID,
            totalPrice: '1000',
            finalPrice: '900',
            createdAt,
            user: {
              id: 'user-1',
              name: 'Ali',
            },
            payment: {
              status: 'success',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      /**
       * Act by requesting the administrator order report.
       */
      const result = await service.getAdminOrderReport(
        undefined,
        undefined,
        undefined,
        1,
        20,
      );

      /**
       * Assert that repository arguments and DTO mapping are correct.
       */
      expect(repository.getAdminOrderReport).toHaveBeenCalledWith(
        undefined,
        undefined,
        undefined,
        1,
        20,
      );

      expect(result).toEqual({
        data: [
          {
            orderId: 'order-1',
            customerId: 'user-1',
            customerName: 'Ali',
            status: OrderStatus.PAID,
            totalPrice: '1000',
            finalPrice: '900',
            paymentStatus: 'success',
            createdAt: '2026-01-10T10:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });
  });

  describe('getAdminProductReport', () => {
    it('should calculate available stock and map product data correctly', async () => {
      /**
       * Arrange a product with reserved inventory so the service must
       * calculate the currently available stock.
       */
      const createdAt = new Date('2026-01-11T10:00:00.000Z');

      repository.getAdminProductReport.mockResolvedValue({
        products: [
          {
            id: 'product-1',
            name: 'Ethiopian Coffee',
            status: ProductStatus.ACTIVE,
            price: 250000,
            createdAt,
            seller: {
              id: 'seller-1',
              name: 'Coffee Seller',
            },
            inventory: {
              stock: 20,
              reservedStock: 6,
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      /**
       * Act by requesting the administrator product report.
       */
      const result = await service.getAdminProductReport(undefined, 1, 20);

      /**
       * Assert that available stock is calculated from physical stock
       * minus reserved stock.
       */
      expect(result).toEqual({
        data: [
          {
            productId: 'product-1',
            name: 'Ethiopian Coffee',
            sellerId: 'seller-1',
            sellerName: 'Coffee Seller',
            status: ProductStatus.ACTIVE,
            price: 250000,
            stock: 20,
            reservedStock: 6,
            availableStock: 14,
            createdAt: '2026-01-11T10:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('should use zero values when inventory is missing', async () => {
      /**
       * Arrange a product without an inventory relation.
       */
      repository.getAdminProductReport.mockResolvedValue({
        products: [
          {
            id: 'product-1',
            name: 'Coffee Grinder',
            status: ProductStatus.DRAFT,
            price: 500000,
            createdAt: new Date('2026-01-11T10:00:00.000Z'),
            seller: {
              id: 'seller-1',
              name: null,
            },
            inventory: null,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      /**
       * Act by requesting the administrator product report.
       */
      const result = await service.getAdminProductReport();

      /**
       * Assert that missing inventory does not break report generation.
       */
      expect(result.data[0].stock).toBe(0);
      expect(result.data[0].reservedStock).toBe(0);
      expect(result.data[0].availableStock).toBe(0);
      expect(result.data[0].sellerName).toBeNull();
    });
  });

  describe('getAdminUserReport', () => {
    it('should map administrator user report data correctly', async () => {
      /**
       * Arrange a user with role and account status information.
       */
      repository.getAdminUserReport.mockResolvedValue({
        users: [
          {
            id: 'user-1',
            name: 'Ali',
            phone: '+989121234567',
            status: UserStatus.ACTIVE,
            createdAt: new Date('2026-01-12T10:00:00.000Z'),
            role: {
              name: 'customer',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      /**
       * Act by requesting the administrator user report.
       */
      const result = await service.getAdminUserReport();

      /**
       * Assert that user, role, status, and timestamp are mapped correctly.
       */
      expect(result).toEqual({
        data: [
          {
            userId: 'user-1',
            name: 'Ali',
            phone: '+989121234567',
            role: 'customer',
            status: UserStatus.ACTIVE,
            createdAt: '2026-01-12T10:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });
  });

  describe('getSellerOrderReport', () => {
    it('should include only the authenticated seller items and calculate seller subtotal', async () => {
      /**
       * Arrange a mixed-seller order.
       *
       * The order contains two products owned by the current seller and
       * one product owned by another seller. The service must expose only
       * the current seller's items.
       */
      repository.getSellerOrderReport.mockResolvedValue({
        orders: [
          {
            id: 'order-1',
            status: OrderStatus.PAID,
            createdAt: new Date('2026-01-13T10:00:00.000Z'),
            user: {
              id: 'customer-1',
              name: 'Customer One',
            },
            items: [
              {
                quantity: 2,
                unitPrice: '100',
                product: {
                  id: 'product-1',
                  name: 'Coffee A',
                  seller: {
                    id: 'seller-1',
                  },
                },
              },
              {
                quantity: 1,
                unitPrice: '500',
                product: {
                  id: 'product-2',
                  name: 'Coffee B',
                  seller: {
                    id: 'seller-2',
                  },
                },
              },
              {
                quantity: 3,
                unitPrice: '200',
                product: {
                  id: 'product-3',
                  name: 'Coffee C',
                  seller: {
                    id: 'seller-1',
                  },
                },
              },
            ],
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      /**
       * Act by requesting the report for seller-1.
       */
      const result = await service.getSellerOrderReport(
        'seller-1',
        undefined,
        undefined,
        undefined,
        1,
        20,
      );

      /**
       * Assert that products owned by another seller are excluded and
       * seller revenue is calculated only from historical order-item prices.
       */
      expect(result.data[0]).toEqual({
        orderId: 'order-1',
        customerId: 'customer-1',
        customerName: 'Customer One',
        status: OrderStatus.PAID,
        items: [
          {
            productId: 'product-1',
            productName: 'Coffee A',
            quantity: 2,
            unitPrice: '100',
          },
          {
            productId: 'product-3',
            productName: 'Coffee C',
            quantity: 3,
            unitPrice: '200',
          },
        ],
        sellerSubtotal: '800',
        createdAt: '2026-01-13T10:00:00.000Z',
      });
    });

    it('should handle an order without items belonging to the seller', async () => {
      /**
       * Arrange an order whose products belong entirely to another seller.
       */
      repository.getSellerOrderReport.mockResolvedValue({
        orders: [
          {
            id: 'order-1',
            status: OrderStatus.PAID,
            createdAt: new Date('2026-01-13T10:00:00.000Z'),
            user: {
              id: 'customer-1',
              name: 'Customer One',
            },
            items: [
              {
                quantity: 1,
                unitPrice: '500',
                product: {
                  id: 'product-2',
                  name: 'Other Seller Product',
                  seller: {
                    id: 'seller-2',
                  },
                },
              },
            ],
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      /**
       * Act by requesting the report for seller-1.
       */
      const result = await service.getSellerOrderReport('seller-1');

      /**
       * Assert that no foreign seller product is exposed and the subtotal
       * remains zero.
       */
      expect(result.data[0].items).toEqual([]);
      expect(result.data[0].sellerSubtotal).toBe('0');
    });
  });

  describe('getSellerProductSalesReport', () => {
    it('should map raw seller sales data correctly', async () => {
      /**
       * Arrange raw query results returned by the repository.
       *
       * Database aggregate functions commonly return numeric values as
       * strings, so the service is responsible for normalizing quantities.
       */
      repository.getSellerProductSalesReport.mockResolvedValue({
        products: [
          {
            productId: 'product-1',
            productName: 'Ethiopian Coffee',
            productStatus: ProductStatus.ACTIVE,
            unitPrice: '250000',
            totalQuantitySold: '12',
            totalRevenue: '3000000',
            createdAt: '2026-01-14T10:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      /**
       * Act by requesting the seller product sales report.
       */
      const result = await service.getSellerProductSalesReport('seller-1');

      /**
       * Assert that raw repository values are transformed into the API DTO.
       */
      expect(result).toEqual({
        data: [
          {
            productId: 'product-1',
            productName: 'Ethiopian Coffee',
            productStatus: ProductStatus.ACTIVE,
            unitPrice: '250000',
            totalQuantitySold: 12,
            totalRevenue: '3000000',
            createdAt: '2026-01-14T10:00:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });
  });
});
