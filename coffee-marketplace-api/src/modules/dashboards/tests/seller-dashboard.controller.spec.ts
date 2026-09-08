import { Test, TestingModule } from '@nestjs/testing';

import { SellerDashboardController } from '../controllers/seller-dashboard.controller';
import { DashboardService } from '../services/dashboard.service';

import { SellerDashboardResponseDto } from '../dto/seller-dashboard-response.dto';

describe('SellerDashboardController', () => {
  let controller: SellerDashboardController;

  let dashboardService: {
    getSellerDashboard: jest.Mock;
  };

  beforeEach(async () => {
    dashboardService = {
      getSellerDashboard: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerDashboardController],
      providers: [
        {
          provide: DashboardService,
          useValue: dashboardService,
        },
      ],
    }).compile();

    controller = module.get<SellerDashboardController>(
      SellerDashboardController,
    );
  });

  describe('getDashboard', () => {
    it('should return dashboard statistics for the authenticated seller', async () => {
      const dashboard: SellerDashboardResponseDto = {
        ownProducts: 8,
        ownOrders: 30,
        ownPaidRevenue: '750000.00',
        ownPendingOrders: 4,
        ownLowStockProducts: 2,
      };

      dashboardService.getSellerDashboard.mockResolvedValue(dashboard);

      const request = {
        user: {
          id: 'seller-id',
        },
      } as any;

      const result = await controller.getDashboard(request);

      expect(result).toEqual(dashboard);

      expect(dashboardService.getSellerDashboard).toHaveBeenCalledWith(
        'seller-id',
      );

      expect(dashboardService.getSellerDashboard).toHaveBeenCalledTimes(1);
    });

    it('should use the authenticated user ID instead of a request parameter', async () => {
      dashboardService.getSellerDashboard.mockResolvedValue({
        ownProducts: 0,
        ownOrders: 0,
        ownPaidRevenue: '0',
        ownPendingOrders: 0,
        ownLowStockProducts: 0,
      });

      const request = {
        user: {
          id: 'authenticated-seller-id',
        },
      } as any;

      await controller.getDashboard(request);

      expect(dashboardService.getSellerDashboard).toHaveBeenCalledWith(
        'authenticated-seller-id',
      );

      expect(dashboardService.getSellerDashboard).not.toHaveBeenCalledWith(
        'another-seller-id',
      );
    });
  });
});
