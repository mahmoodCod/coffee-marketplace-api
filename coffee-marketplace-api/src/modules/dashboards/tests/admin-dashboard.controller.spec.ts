import { Test, TestingModule } from '@nestjs/testing';

import { AdminDashboardController } from '../controllers/admin-dashboard.controller';
import { DashboardService } from '../services/dashboard.service';

import { AdminStatisticsResponseDto } from '../dto/admin-statistics-response.dto';
import { AdminSalesResponseDto } from '../dto/admin-sales-response.dto';

describe('AdminDashboardController', () => {
  let controller: AdminDashboardController;

  let dashboardService: {
    getAdminStatistics: jest.Mock;
    getAdminSales: jest.Mock;
  };

  beforeEach(async () => {
    dashboardService = {
      getAdminStatistics: jest.fn(),
      getAdminSales: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminDashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: dashboardService,
        },
      ],
    }).compile();

    controller = module.get<AdminDashboardController>(AdminDashboardController);
  });

  describe('getStatistics', () => {
    it('should return admin dashboard statistics', async () => {
      const statistics: AdminStatisticsResponseDto = {
        totalUsers: 100,
        totalSellers: 10,
        totalProducts: 50,
        totalOrders: 200,
        totalSuccessfulPayments: 150,
        totalRevenue: '1250000.00',
        pendingPaymentOrders: 20,
        lowStockProducts: 5,
      };

      dashboardService.getAdminStatistics.mockResolvedValue(statistics);

      const result = await controller.getStatistics();

      expect(result).toEqual(statistics);

      expect(dashboardService.getAdminStatistics).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSales', () => {
    it('should return admin sales data with the requested filters', async () => {
      const sales: AdminSalesResponseDto = {
        groupBy: 'month',
        data: [
          {
            period: '2026-08-01T00:00:00.000Z',
            ordersCount: 25,
            revenue: '5000000.00',
          },
        ],
      };

      dashboardService.getAdminSales.mockResolvedValue(sales);

      const result = await controller.getSales(
        '2026-08-01',
        '2026-08-31',
        'month',
      );

      expect(result).toEqual(sales);

      expect(dashboardService.getAdminSales).toHaveBeenCalledWith(
        '2026-08-01',
        '2026-08-31',
        'month',
      );
    });

    it('should use day as the default grouping mode', async () => {
      const sales: AdminSalesResponseDto = {
        groupBy: 'day',
        data: [],
      };

      dashboardService.getAdminSales.mockResolvedValue(sales);

      const result = await controller.getSales();

      expect(result).toEqual(sales);

      expect(dashboardService.getAdminSales).toHaveBeenCalledWith(
        undefined,
        undefined,
        'day',
      );
    });
  });
});
