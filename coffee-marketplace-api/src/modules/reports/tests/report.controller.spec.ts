import { Test, TestingModule } from '@nestjs/testing';

import { ReportController } from '../controllers/report.controller';
import { ReportService } from '../services/report.service';

import { OrderStatus } from '../../orders/enums/order-status.enum';
import { ProductStatus } from '../../products/enums/product-status.enum';
import { UserStatus } from '../../users/enums/user-status.enum';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';

describe('ReportController', () => {
  let controller: ReportController;

  let reportService: {
    getAdminOrderReport: jest.Mock;
    getAdminProductReport: jest.Mock;
    getAdminUserReport: jest.Mock;
  };

  beforeEach(async () => {
    reportService = {
      getAdminOrderReport: jest.fn(),
      getAdminProductReport: jest.fn(),
      getAdminUserReport: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportController],
      providers: [
        {
          provide: ReportService,
          useValue: reportService,
        },
      ],
    }).compile();

    controller = module.get<ReportController>(ReportController);
  });

  describe('getAdminOrderReport', () => {
    it('should convert query parameters and delegate to the service', async () => {
      /**
       * Arrange the service response returned after report generation.
       */
      const serviceResponse = {
        data: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
      };

      reportService.getAdminOrderReport.mockResolvedValue(serviceResponse);

      /**
       * Act by providing validated query DTO values.
       */
      const result = await controller.getAdminOrderReport({
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-01-31T23:59:59.999Z',
        status: OrderStatus.PAID,
        page: 2,
        limit: 10,
      });

      /**
       * Assert that the controller converted the query values correctly.
       */
      expect(reportService.getAdminOrderReport).toHaveBeenCalledWith(
        new Date('2026-01-01T00:00:00.000Z'),
        new Date('2026-01-31T23:59:59.999Z'),
        OrderStatus.PAID,
        2,
        10,
      );

      expect(result).toBe(serviceResponse);
    });
  });

  describe('getAdminProductReport', () => {
    it('should convert pagination parameters and delegate to the service', async () => {
      /**
       * Arrange the service response returned for the requested page.
       */
      const serviceResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      reportService.getAdminProductReport.mockResolvedValue(serviceResponse);

      /**
       * Act using validated query DTO values.
       */
      const result = await controller.getAdminProductReport({
        status: ProductStatus.ACTIVE,
        page: 3,
        limit: 25,
      });

      /**
       * Assert that pagination values reach the service.
       */
      expect(reportService.getAdminProductReport).toHaveBeenCalledWith(
        ProductStatus.ACTIVE,
        3,
        25,
      );

      expect(result).toBe(serviceResponse);
    });
  });

  describe('getAdminUserReport', () => {
    it('should pass user filters and pagination values to the service', async () => {
      /**
       * Arrange the service response for the filtered user report.
       */
      const serviceResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      reportService.getAdminUserReport.mockResolvedValue(serviceResponse);

      /**
       * Act using account-status, role, and pagination filters.
       */
      const result = await controller.getAdminUserReport({
        status: UserStatus.ACTIVE,
        role: SYSTEM_ROLES.CUSTOMER,
        page: 2,
        limit: 15,
      });

      /**
       * Assert that all filters reach the service unchanged.
       */
      expect(reportService.getAdminUserReport).toHaveBeenCalledWith(
        UserStatus.ACTIVE,
        SYSTEM_ROLES.CUSTOMER,
        2,
        15,
      );

      expect(result).toBe(serviceResponse);
    });
  });
});
