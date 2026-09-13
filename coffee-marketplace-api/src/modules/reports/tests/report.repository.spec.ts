import { ReportRepository } from '../repositories/report.repository';
import { OrderStatus } from '../../orders/enums/order-status.enum';

describe('ReportRepository', () => {
  let repository: ReportRepository;

  beforeEach(() => {
    repository = Object.create(ReportRepository.prototype);
  });

  describe('getAdminOrderReport', () => {
    it('should return paginated admin order report', async () => {
      const orders = [
        {
          id: 'order-1',
          status: OrderStatus.PAID,
          totalPrice: '500000.00',
          finalPrice: '450000.00',
          createdAt: new Date('2026-08-01T10:00:00.000Z'),
          user: {
            id: 'user-1',
            name: 'John Doe',
          },
          payment: {
            status: 'success',
          },
        },
      ];

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([orders, 25]),
      };

      repository.orderRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.getAdminOrderReport(
        undefined,
        undefined,
        undefined,
        2,
        10,
      );

      expect(result).toEqual({
        orders,
        total: 25,
        page: 2,
        limit: 10,
        totalPages: 3,
      });

      expect(queryBuilder.skip).toHaveBeenCalledWith(10);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(queryBuilder.orderBy).toHaveBeenCalledWith(
        'order.createdAt',
        'DESC',
      );
    });

    it('should apply date range filters', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.orderRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const from = new Date('2026-08-01T00:00:00.000Z');
      const to = new Date('2026-08-31T23:59:59.999Z');

      await repository.getAdminOrderReport(from, to, undefined, 1, 20);

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'order.createdAt >= :from',
        { from },
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'order.createdAt <= :to',
        { to },
      );
    });

    it('should apply order status filter', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.orderRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      await repository.getAdminOrderReport(
        undefined,
        undefined,
        OrderStatus.PAID,
        1,
        20,
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'order.status = :status',
        {
          status: OrderStatus.PAID,
        },
      );
    });

    it('should calculate total pages correctly', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 21]),
      };

      repository.orderRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.getAdminOrderReport(
        undefined,
        undefined,
        undefined,
        2,
        10,
      );

      expect(result.total).toBe(21);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });

    it('should return an empty report when no orders match the filters', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      repository.orderRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.getAdminOrderReport();

      expect(result).toEqual({
        orders: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });
    });

    describe('getAdminProductReport', () => {
      it('should return paginated admin product report', async () => {
        const products = [
          {
            id: 'product-1',
            name: 'Ethiopian Coffee',
            status: ProductStatus.ACTIVE,
            price: '350000.00',
            createdAt: new Date('2026-08-01T10:00:00.000Z'),
            seller: {
              id: 'seller-1',
              name: 'Seller One',
            },
            inventory: {
              stock: 20,
              reservedStock: 5,
            },
          },
        ];

        const queryBuilder = {
          innerJoinAndSelect: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([products, 25]),
        };

        repository.productRepository = {
          createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        } as any;

        const result = await repository.getAdminProductReport(undefined, 2, 10);

        expect(result).toEqual({
          products,
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        });

        expect(queryBuilder.skip).toHaveBeenCalledWith(10);
        expect(queryBuilder.take).toHaveBeenCalledWith(10);

        expect(queryBuilder.orderBy).toHaveBeenCalledWith(
          'product.createdAt',
          'DESC',
        );
      });

      it('should apply product status filter', async () => {
        const queryBuilder = {
          innerJoinAndSelect: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };

        repository.productRepository = {
          createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        } as any;

        await repository.getAdminProductReport(ProductStatus.ACTIVE, 1, 20);

        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
          'product.status = :status',
          {
            status: ProductStatus.ACTIVE,
          },
        );
      });

      it('should calculate total pages correctly', async () => {
        const queryBuilder = {
          innerJoinAndSelect: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 21]),
        };

        repository.productRepository = {
          createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        } as any;

        const result = await repository.getAdminProductReport(undefined, 2, 10);

        expect(result.total).toBe(21);
        expect(result.page).toBe(2);
        expect(result.limit).toBe(10);
        expect(result.totalPages).toBe(3);
      });

      it('should return an empty report when no products match the filters', async () => {
        const queryBuilder = {
          innerJoinAndSelect: jest.fn().mockReturnThis(),
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };

        repository.productRepository = {
          createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        } as any;

        const result = await repository.getAdminProductReport();

        expect(result).toEqual({
          products: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        });
      });
    });
  });
});
