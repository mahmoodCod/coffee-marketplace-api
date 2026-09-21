import { Test, TestingModule } from '@nestjs/testing';

import { SellerReportController } from '../controllers/seller-report.controller';
import { ReportService } from '../services/report.service';

import { OrderStatus } from '../../orders/enums/order-status.enum';

describe('SellerReportController', () => {
  let controller: SellerReportController;

  let reportService: {
    getSellerOrderReport: jest.Mock;
    getSellerProductSalesReport: jest.Mock;
  };

  beforeEach(async () => {
    reportService = {
      getSellerOrderReport: jest.fn(),
      getSellerProductSalesReport: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SellerReportController],
      providers: [
        {
          provide: ReportService,
          useValue: reportService,
        },
      ],
    }).compile();

    controller = module.get<SellerReportController>(SellerReportController);
  });

  describe('getSellerOrderReport', () => {
    it('should use the authenticated JWT subject as the seller scope', async () => {
      /**
       * Arrange the authenticated seller JWT payload and service response.
       */
      const authenticatedUser = {
        sub: 'seller-1',
      };

      const serviceResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      reportService.getSellerOrderReport.mockResolvedValue(serviceResponse);

      /**
       * Act by requesting the seller order report.
       */
      const result = await controller.getSellerOrderReport(
        authenticatedUser as any,
        {
          from: '2026-01-01T00:00:00.000Z',
          to: '2026-01-31T23:59:59.999Z',
          status: OrderStatus.PAID,
          page: 2,
          limit: 10,
        },
      );

      /**
       * Assert that the JWT `sub` is used as the seller scope.
       *
       * The controller does not accept a seller ID from query parameters.
       */
      expect(reportService.getSellerOrderReport).toHaveBeenCalledWith(
        'seller-1',
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-01-31T23:59:59.999Z'),
        OrderStatus.PAID,
        2,
        10,
      );

      expect(result).toBe(serviceResponse);
    });
  });

  describe('getSellerProductSalesReport', () => {
    it('should use the authenticated JWT subject for product sales reports', async () => {
      /**
       * Arrange the authenticated seller JWT payload and service response.
       */
      const authenticatedUser = {
        sub: 'seller-2',
      };

      const serviceResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      reportService.getSellerProductSalesReport.mockResolvedValue(
        serviceResponse,
      );

      /**
       * Act by requesting the seller product sales report.
       */
      const result = await controller.getSellerProductSalesReport(
        authenticatedUser as any,
        {
          from: '2026-02-01T00:00:00.000Z',
          to: '2026-02-28T23:59:59.999Z',
          page: 3,
          limit: 5,
        },
      );

      /**
       * Assert that the JWT `sub` defines the seller scope.
       */
      expect(reportService.getSellerProductSalesReport).toHaveBeenCalledWith(
        'seller-2',
        new Date('2026-02-01T00:00:00.000Z'),
        new Date('2026-02-28T23:59:59.999Z'),
        3,
        5,
      );

      expect(result).toBe(serviceResponse);
    });
  });
});
