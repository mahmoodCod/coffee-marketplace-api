import { Test, TestingModule } from '@nestjs/testing';

import { DashboardService } from '../services/dashboard.service';
import { DashboardRepository } from '../repositories/dashboard.repository';

describe('DashboardService', () => {
  let service: DashboardService;
  let repository: {
    countUsers: jest.Mock;
    countSellers: jest.Mock;
    countProducts: jest.Mock;
    countOrders: jest.Mock;
    countSuccessfulPayments: jest.Mock;
    getTotalRevenue: jest.Mock;
    countPendingPaymentOrders: jest.Mock;
    countLowStockProducts: jest.Mock;
    getAdminSales: jest.Mock;
    countSellerProducts: jest.Mock;
    countSellerOrders: jest.Mock;
    getSellerPaidRevenue: jest.Mock;
    countSellerPendingOrders: jest.Mock;
    countSellerLowStockProducts: jest.Mock;
  };

  beforeEach(async () => {
    repository = {
      countUsers: jest.fn(),
      countSellers: jest.fn(),
      countProducts: jest.fn(),
      countOrders: jest.fn(),
      countSuccessfulPayments: jest.fn(),
      getTotalRevenue: jest.fn(),
      countPendingPaymentOrders: jest.fn(),
      countLowStockProducts: jest.fn(),
      getAdminSales: jest.fn(),
      countSellerProducts: jest.fn(),
      countSellerOrders: jest.fn(),
      getSellerPaidRevenue: jest.fn(),
      countSellerPendingOrders: jest.fn(),
      countSellerLowStockProducts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: DashboardRepository,
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getAdminStatistics', () => {
    it('should return aggregated admin dashboard statistics', async () => {
      repository.countUsers.mockResolvedValue(100);
      repository.countSellers.mockResolvedValue(10);
      repository.countProducts.mockResolvedValue(50);
      repository.countOrders.mockResolvedValue(200);
      repository.countSuccessfulPayments.mockResolvedValue(150);
      repository.getTotalRevenue.mockResolvedValue('1250000.00');
      repository.countPendingPaymentOrders.mockResolvedValue(20);
      repository.countLowStockProducts.mockResolvedValue(5);

      const result = await service.getAdminStatistics();

      expect(result).toEqual({
        totalUsers: 100,
        totalSellers: 10,
        totalProducts: 50,
        totalOrders: 200,
        totalSuccessfulPayments: 150,
        totalRevenue: '1250000.00',
        pendingPaymentOrders: 20,
        lowStockProducts: 5,
      });

      expect(repository.countUsers).toHaveBeenCalledTimes(1);
      expect(repository.countSellers).toHaveBeenCalledTimes(1);
      expect(repository.countProducts).toHaveBeenCalledTimes(1);
      expect(repository.countOrders).toHaveBeenCalledTimes(1);
      expect(repository.countSuccessfulPayments).toHaveBeenCalledTimes(1);
      expect(repository.getTotalRevenue).toHaveBeenCalledTimes(1);
      expect(repository.countPendingPaymentOrders).toHaveBeenCalledTimes(1);
      expect(repository.countLowStockProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAdminSales', () => {
    it('should return sales data with the requested filters', async () => {
      const salesData = [
        {
          period: '2026-08-01',
          ordersCount: 10,
          revenue: '500000.00',
        },
      ];

      repository.getAdminSales.mockResolvedValue(salesData);

      const result = await service.getAdminSales(
        '2026-08-01',
        '2026-08-31',
        'day',
      );

      expect(result).toEqual({
        groupBy: 'day',
        data: salesData,
      });

      expect(repository.getAdminSales).toHaveBeenCalledWith(
        '2026-08-01',
        '2026-08-31',
        'day',
      );
    });

    it('should use day as the default grouping mode', async () => {
      repository.getAdminSales.mockResolvedValue([]);

      const result = await service.getAdminSales();

      expect(result).toEqual({
        groupBy: 'day',
        data: [],
      });

      expect(repository.getAdminSales).toHaveBeenCalledWith(
        undefined,
        undefined,
        'day',
      );
    });
  });

  describe('getSellerDashboard', () => {
    it('should return statistics belonging to the requested seller', async () => {
      repository.countSellerProducts.mockResolvedValue(8);
      repository.countSellerOrders.mockResolvedValue(30);
      repository.getSellerPaidRevenue.mockResolvedValue('750000.00');
      repository.countSellerPendingOrders.mockResolvedValue(4);
      repository.countSellerLowStockProducts.mockResolvedValue(2);

      const result = await service.getSellerDashboard('seller-id');

      expect(result).toEqual({
        ownProducts: 8,
        ownOrders: 30,
        ownPaidRevenue: '750000.00',
        ownPendingOrders: 4,
        ownLowStockProducts: 2,
      });

      expect(repository.countSellerProducts).toHaveBeenCalledWith('seller-id');
      expect(repository.countSellerOrders).toHaveBeenCalledWith('seller-id');
      expect(repository.getSellerPaidRevenue).toHaveBeenCalledWith('seller-id');
      expect(repository.countSellerPendingOrders).toHaveBeenCalledWith(
        'seller-id',
      );
      expect(repository.countSellerLowStockProducts).toHaveBeenCalledWith(
        'seller-id',
      );
    });
  });
});
