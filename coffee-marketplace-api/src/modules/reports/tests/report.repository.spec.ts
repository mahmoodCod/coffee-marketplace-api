import { ReportRepository } from '../repositories/report.repository';
import { OrderStatus } from '../../orders/enums/order-status.enum';
import { ProductStatus } from '../../products/enums/product-status.enum';
import { SYSTEM_ROLES } from '../../../common/constants/system-roles.constant';
import { UserStatus } from '../../users/enums/user-status.enum';

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

    describe('getAdminUserReport', () => {
      it('should return paginated admin user report', async () => {
        const users = [
          {
            id: 'user-1',
            name: 'John Doe',
            phone: '+989121234567',
            status: UserStatus.ACTIVE,
            createdAt: new Date('2026-08-01T10:00:00.000Z'),
            role: {
              name: SYSTEM_ROLES.CUSTOMER,
            },
          },
        ];

        const queryBuilder = {
          innerJoinAndSelect: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([users, 25]),
        };

        repository.userRepository = {
          createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        } as any;

        const result = await repository.getAdminUserReport(
          undefined,
          undefined,
          2,
          10,
        );

        expect(result).toEqual({
          users,
          total: 25,
          page: 2,
          limit: 10,
          totalPages: 3,
        });

        expect(queryBuilder.skip).toHaveBeenCalledWith(10);
        expect(queryBuilder.take).toHaveBeenCalledWith(10);

        expect(queryBuilder.orderBy).toHaveBeenCalledWith(
          'user.createdAt',
          'DESC',
        );
      });

      it('should apply user status filter', async () => {
        const queryBuilder = {
          innerJoinAndSelect: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };

        repository.userRepository = {
          createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        } as any;

        await repository.getAdminUserReport(
          UserStatus.ACTIVE,
          undefined,
          1,
          20,
        );

        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
          'user.status = :status',
          {
            status: UserStatus.ACTIVE,
          },
        );
      });

      it('should apply user role filter', async () => {
        const queryBuilder = {
          innerJoinAndSelect: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };

        repository.userRepository = {
          createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        } as any;

        await repository.getAdminUserReport(
          undefined,
          SYSTEM_ROLES.SELLER,
          1,
          20,
        );

        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
          'role.name = :role',
          {
            role: SYSTEM_ROLES.SELLER,
          },
        );
      });

      it('should calculate total pages correctly', async () => {
        const queryBuilder = {
          innerJoinAndSelect: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 21]),
        };

        repository.userRepository = {
          createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        } as any;

        const result = await repository.getAdminUserReport(
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

      it('should return an empty report when no users match the filters', async () => {
        const queryBuilder = {
          innerJoinAndSelect: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
        };

        repository.userRepository = {
          createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
        } as any;

        const result = await repository.getAdminUserReport();

        expect(result).toEqual({
          users: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        });
      });
    });

    describe('getSellerOrderReport', () => {
      const createSellerOrderQueryBuilder = (
        overrides: Record<string, jest.Mock> = {},
      ) => ({
        innerJoin: jest.fn().mockReturnThis(),
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
        getRawMany: jest.fn().mockResolvedValue([]),
        getMany: jest.fn().mockResolvedValue([]),
        ...overrides,
      });

      it('should return paginated seller order report', async () => {
        const orders = [
          {
            id: 'order-1',
            items: [
              {
                id: 'item-1',
                quantity: 2,
                unitPrice: '500000',
                product: {
                  id: 'product-1',
                  seller: {
                    id: 'seller-1',
                  },
                },
              },
            ],
          },
        ];

        const countQueryBuilder = createSellerOrderQueryBuilder({
          getRawOne: jest.fn().mockResolvedValue({ count: '1' }),
        });

        const idQueryBuilder = createSellerOrderQueryBuilder({
          getRawMany: jest.fn().mockResolvedValue([{ id: 'order-1' }]),
        });

        const loadQueryBuilder = createSellerOrderQueryBuilder({
          getMany: jest.fn().mockResolvedValue(orders),
        });

        const repository = Object.create(ReportRepository.prototype);

        repository.orderRepository = {
          createQueryBuilder: jest
            .fn()
            .mockReturnValueOnce(countQueryBuilder)
            .mockReturnValueOnce(idQueryBuilder)
            .mockReturnValueOnce(loadQueryBuilder),
        };

        const result = await repository.getSellerOrderReport('seller-1');

        expect(
          repository.orderRepository.createQueryBuilder,
        ).toHaveBeenCalledWith('order');

        expect(countQueryBuilder.where).toHaveBeenCalledWith(
          'seller.id = :sellerId',
          {
            sellerId: 'seller-1',
          },
        );

        expect(idQueryBuilder.offset).toHaveBeenCalledWith(0);
        expect(idQueryBuilder.limit).toHaveBeenCalledWith(20);

        expect(result).toEqual({
          orders,
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        });
      });

      it('should apply date range filters', async () => {
        const from = new Date('2026-01-01');
        const to = new Date('2026-01-31');

        const countQueryBuilder = createSellerOrderQueryBuilder({
          getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
        });

        const repository = Object.create(ReportRepository.prototype);

        repository.orderRepository = {
          createQueryBuilder: jest.fn().mockReturnValue(countQueryBuilder),
        };

        await repository.getSellerOrderReport('seller-1', from, to);

        expect(countQueryBuilder.andWhere).toHaveBeenCalledWith(
          'order.createdAt >= :from',
          { from },
        );

        expect(countQueryBuilder.andWhere).toHaveBeenCalledWith(
          'order.createdAt <= :to',
          { to },
        );
      });

      it('should apply order status filter', async () => {
        const countQueryBuilder = createSellerOrderQueryBuilder({
          getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
        });

        const repository = Object.create(ReportRepository.prototype);

        repository.orderRepository = {
          createQueryBuilder: jest.fn().mockReturnValue(countQueryBuilder),
        };

        await repository.getSellerOrderReport(
          'seller-1',
          undefined,
          undefined,
          OrderStatus.PAID,
        );

        expect(countQueryBuilder.andWhere).toHaveBeenCalledWith(
          'order.status = :status',
          {
            status: OrderStatus.PAID,
          },
        );
      });

      it('should calculate total pages', async () => {
        const countQueryBuilder = createSellerOrderQueryBuilder({
          getRawOne: jest.fn().mockResolvedValue({ count: '41' }),
        });

        const idQueryBuilder = createSellerOrderQueryBuilder({
          getRawMany: jest.fn().mockResolvedValue([]),
        });

        const repository = Object.create(ReportRepository.prototype);

        repository.orderRepository = {
          createQueryBuilder: jest
            .fn()
            .mockReturnValueOnce(countQueryBuilder)
            .mockReturnValueOnce(idQueryBuilder),
        };

        const result = await repository.getSellerOrderReport(
          'seller-1',
          undefined,
          undefined,
          undefined,
          2,
          20,
        );

        expect(idQueryBuilder.offset).toHaveBeenCalledWith(20);
        expect(idQueryBuilder.limit).toHaveBeenCalledWith(20);

        expect(result.totalPages).toBe(3);
        expect(result.page).toBe(2);
      });

      it('should return an empty report when no seller orders exist', async () => {
        const countQueryBuilder = createSellerOrderQueryBuilder({
          getRawOne: jest.fn().mockResolvedValue({ count: '0' }),
        });

        const repository = Object.create(ReportRepository.prototype);

        repository.orderRepository = {
          createQueryBuilder: jest.fn().mockReturnValue(countQueryBuilder),
        };

        const result = await repository.getSellerOrderReport('seller-1');

        expect(result).toEqual({
          orders: [],
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        });
      });
    });

    describe('getSellerProductSalesReport', () => {
      it('should return paginated seller product sales report', async () => {
        const products = [
          {
            productId: 'product-1',
            productName: 'Ethiopian Coffee',
            productStatus: ProductStatus.ACTIVE,
            unitPrice: '800000',
            totalQuantitySold: '5',
            totalRevenue: '3500000',
            createdAt: '2026-01-01',
          },
        ];

        const salesQueryBuilder: any = {
          innerJoin: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          setParameter: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          addGroupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue(products),
        };

        const countQueryBuilder: any = {
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(1),
        };

        const repository = Object.create(ReportRepository.prototype);

        repository.productRepository = {
          createQueryBuilder: jest
            .fn()
            .mockReturnValueOnce(salesQueryBuilder)
            .mockReturnValueOnce(countQueryBuilder),
        };

        const result = await repository.getSellerProductSalesReport('seller-1');

        expect(
          repository.productRepository.createQueryBuilder,
        ).toHaveBeenCalledTimes(2);

        expect(salesQueryBuilder.where).toHaveBeenCalledWith(
          'seller.id = :sellerId',
          {
            sellerId: 'seller-1',
          },
        );

        expect(salesQueryBuilder.leftJoin).toHaveBeenCalledWith(
          'orderItem.order',
          'order',
          'order.paidAt IS NOT NULL',
        );

        expect(salesQueryBuilder.skip).toHaveBeenCalledWith(0);
        expect(salesQueryBuilder.take).toHaveBeenCalledWith(20);

        expect(result).toEqual({
          products,
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        });
      });

      it('should apply date range filters on the paid-order join', async () => {
        const from = new Date('2026-01-01');
        const to = new Date('2026-01-31');

        const salesQueryBuilder: any = {
          innerJoin: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          setParameter: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          addGroupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        };

        const countQueryBuilder: any = {
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
        };

        const repository = Object.create(ReportRepository.prototype);

        repository.productRepository = {
          createQueryBuilder: jest
            .fn()
            .mockReturnValueOnce(salesQueryBuilder)
            .mockReturnValueOnce(countQueryBuilder),
        };

        await repository.getSellerProductSalesReport('seller-1', from, to);

        expect(salesQueryBuilder.leftJoin).toHaveBeenCalledWith(
          'orderItem.order',
          'order',
          'order.paidAt IS NOT NULL AND order.paidAt >= :from AND order.paidAt <= :to',
        );

        expect(salesQueryBuilder.setParameter).toHaveBeenCalledWith(
          'from',
          from,
        );
        expect(salesQueryBuilder.setParameter).toHaveBeenCalledWith('to', to);
      });

      it('should calculate total pages correctly', async () => {
        const salesQueryBuilder: any = {
          innerJoin: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          setParameter: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          addGroupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        };

        const countQueryBuilder: any = {
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(41),
        };

        const repository = Object.create(ReportRepository.prototype);

        repository.productRepository = {
          createQueryBuilder: jest
            .fn()
            .mockReturnValueOnce(salesQueryBuilder)
            .mockReturnValueOnce(countQueryBuilder),
        };

        const result = await repository.getSellerProductSalesReport(
          'seller-1',
          undefined,
          undefined,
          2,
          20,
        );

        expect(salesQueryBuilder.skip).toHaveBeenCalledWith(20);
        expect(salesQueryBuilder.take).toHaveBeenCalledWith(20);

        expect(result.total).toBe(41);
        expect(result.page).toBe(2);
        expect(result.limit).toBe(20);
        expect(result.totalPages).toBe(3);
      });

      it('should return an empty report when seller has no products', async () => {
        const salesQueryBuilder: any = {
          innerJoin: jest.fn().mockReturnThis(),
          leftJoin: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          setParameter: jest.fn().mockReturnThis(),
          groupBy: jest.fn().mockReturnThis(),
          addGroupBy: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          getRawMany: jest.fn().mockResolvedValue([]),
        };

        const countQueryBuilder: any = {
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          getCount: jest.fn().mockResolvedValue(0),
        };

        const repository = Object.create(ReportRepository.prototype);

        repository.productRepository = {
          createQueryBuilder: jest
            .fn()
            .mockReturnValueOnce(salesQueryBuilder)
            .mockReturnValueOnce(countQueryBuilder),
        };

        const result = await repository.getSellerProductSalesReport('seller-1');

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
