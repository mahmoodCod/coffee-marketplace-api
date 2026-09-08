import { DashboardRepository } from '../repositories/dashboard.repository';
import { OrderStatus } from '../../orders/enums/order-status.enum';
import { ProductStatus } from 'src/modules/products/enums';
import { PaymentStatus } from 'src/modules/payments/enums/payment-status.enum';

describe('DashboardRepository', () => {
  let repository: DashboardRepository;

  let orderRepository: {
    createQueryBuilder: jest.Mock;
  };

  let productRepository: {
    createQueryBuilder: jest.Mock;
  };

  beforeEach(() => {
    orderRepository = {
      createQueryBuilder: jest.fn(),
    };

    productRepository = {
      createQueryBuilder: jest.fn(),
    };

    /**
     * The repository methods under test only depend on TypeORM repositories.
     *
     * Creating the repository with Object.create allows these unit tests
     * to focus on query construction and result mapping without connecting
     * to a real database.
     */
    repository = Object.create(DashboardRepository.prototype);

    Object.assign(repository, {
      orderRepository,
      productRepository,
    });
  });

  describe('getSellerPaidRevenue', () => {
    it('should calculate gross revenue from the seller own paid order items', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          revenue: '750000.00',
        }),
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.getSellerPaidRevenue('seller-id');

      expect(result).toBe('750000.00');

      expect(orderRepository.createQueryBuilder).toHaveBeenCalledWith('order');

      expect(queryBuilder.innerJoin).toHaveBeenNthCalledWith(
        1,
        'order.items',
        'orderItem',
      );

      expect(queryBuilder.innerJoin).toHaveBeenNthCalledWith(
        2,
        'orderItem.product',
        'product',
      );

      expect(queryBuilder.select).toHaveBeenCalledWith(
        'COALESCE(SUM(orderItem.unitPrice * orderItem.quantity), 0)',
        'revenue',
      );

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'product.seller_id = :sellerId',
        { sellerId: 'seller-id' },
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'order.status = :status',
        { status: OrderStatus.PAID },
      );
    });

    it('should return zero when the seller has no paid revenue', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          revenue: '0',
        }),
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.getSellerPaidRevenue('seller-id');

      expect(result).toBe('0');
    });

    it('should return zero when the database returns no aggregate result', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(undefined),
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.getSellerPaidRevenue('seller-id');

      expect(result).toBe('0');
    });
  });

  describe('countSellerOrders', () => {
    it('should count each seller order only once', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          count: '3',
        }),
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.countSellerOrders('seller-id');

      expect(result).toBe(3);

      expect(queryBuilder.select).toHaveBeenCalledWith(
        'COUNT(DISTINCT order.id)',
        'count',
      );

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'product.seller_id = :sellerId',
        { sellerId: 'seller-id' },
      );
    });

    it('should return zero when the seller has no orders', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          count: '0',
        }),
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.countSellerOrders('seller-id');

      expect(result).toBe(0);
    });
  });

  describe('countSellerPendingOrders', () => {
    it('should count only pending orders containing the seller products', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          count: '4',
        }),
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.countSellerPendingOrders('seller-id');

      expect(result).toBe(4);

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'product.seller_id = :sellerId',
        { sellerId: 'seller-id' },
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'order.status = :status',
        { status: OrderStatus.PENDING_PAYMENT },
      );

      expect(queryBuilder.select).toHaveBeenCalledWith(
        'COUNT(DISTINCT order.id)',
        'count',
      );
    });

    it('should return zero when the seller has no pending orders', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          count: '0',
        }),
      };

      orderRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.countSellerPendingOrders('seller-id');

      expect(result).toBe(0);
    });
  });

  describe('countLowStockProducts', () => {
    it('should count active products whose available stock is at or below the threshold', async () => {
      const getCount = jest.fn().mockResolvedValue(3);

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount,
      };

      repository.productRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.countLowStockProducts();

      expect(result).toBe(3);

      expect(
        repository.productRepository.createQueryBuilder,
      ).toHaveBeenCalledWith('product');

      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'product.inventory',
        'inventory',
      );

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'product.status = :status',
        {
          status: ProductStatus.ACTIVE,
        },
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'inventory.stock - inventory.reservedStock <= :threshold',
        {
          threshold: 5,
        },
      );

      expect(getCount).toHaveBeenCalled();
    });

    it('should return zero when no active products are low-stock', async () => {
      const getCount = jest.fn().mockResolvedValue(0);

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount,
      };

      repository.productRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.countLowStockProducts();

      expect(result).toBe(0);
    });
  });

  describe('countSellerLowStockProducts', () => {
    it('should count active low-stock products belonging to the seller', async () => {
      const getCount = jest.fn().mockResolvedValue(2);

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount,
      };

      repository.productRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const sellerId = 'seller-id';

      const result = await repository.countSellerLowStockProducts(sellerId);

      expect(result).toBe(2);

      expect(queryBuilder.innerJoin).toHaveBeenNthCalledWith(
        1,
        'product.inventory',
        'inventory',
      );

      expect(queryBuilder.innerJoin).toHaveBeenNthCalledWith(
        2,
        'product.seller',
        'seller',
      );

      expect(queryBuilder.where).toHaveBeenCalledWith('seller.id = :sellerId', {
        sellerId,
      });

      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        1,
        'product.status = :status',
        {
          status: ProductStatus.ACTIVE,
        },
      );

      expect(queryBuilder.andWhere).toHaveBeenNthCalledWith(
        2,
        'inventory.stock - inventory.reservedStock <= :threshold',
        {
          threshold: 5,
        },
      );

      expect(getCount).toHaveBeenCalled();
    });

    it('should return zero when the seller has no active low-stock products', async () => {
      const getCount = jest.fn().mockResolvedValue(0);

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount,
      };

      repository.productRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.countSellerLowStockProducts('seller-id');

      expect(result).toBe(0);
    });
  });

  describe('countSellers', () => {
    it('should count users with the seller role', async () => {
      const getCount = jest.fn().mockResolvedValue(4);

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount,
      };

      repository.userRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.countSellers();

      expect(result).toBe(4);

      expect(repository.userRepository.createQueryBuilder).toHaveBeenCalledWith(
        'user',
      );

      expect(queryBuilder.innerJoin).toHaveBeenCalledWith('user.role', 'role');

      expect(queryBuilder.where).toHaveBeenCalledWith('role.name = :roleName', {
        roleName: 'seller',
      });

      expect(getCount).toHaveBeenCalled();
    });

    it('should return zero when no sellers exist', async () => {
      const getCount = jest.fn().mockResolvedValue(0);

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount,
      };

      repository.userRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.countSellers();

      expect(result).toBe(0);
    });
  });

  describe('countSellerProducts', () => {
    it('should count products belonging to the specified seller', async () => {
      const count = jest.fn().mockResolvedValue(6);

      repository.productRepository = {
        count,
      } as any;

      const sellerId = 'seller-id';

      const result = await repository.countSellerProducts(sellerId);

      expect(result).toBe(6);

      expect(count).toHaveBeenCalledWith({
        where: {
          seller: {
            id: sellerId,
          },
        },
      });
    });

    it('should return zero when the seller has no products', async () => {
      const count = jest.fn().mockResolvedValue(0);

      repository.productRepository = {
        count,
      } as any;

      const result = await repository.countSellerProducts('seller-id');

      expect(result).toBe(0);

      expect(count).toHaveBeenCalledWith({
        where: {
          seller: {
            id: 'seller-id',
          },
        },
      });
    });
  });

  describe('countUsers', () => {
    it('should return the total number of users', async () => {
      const getCount = jest.fn().mockResolvedValue(10);

      repository.userRepository = {
        count: getCount,
      } as any;

      const result = await repository.countUsers();

      expect(result).toBe(10);
      expect(getCount).toHaveBeenCalledWith();
    });

    it('should return zero when no users exist', async () => {
      const getCount = jest.fn().mockResolvedValue(0);

      repository.userRepository = {
        count: getCount,
      } as any;

      const result = await repository.countUsers();

      expect(result).toBe(0);
    });
  });

  describe('countProducts', () => {
    it('should return the total number of products', async () => {
      const getCount = jest.fn().mockResolvedValue(15);

      repository.productRepository = {
        count: getCount,
      } as any;

      const result = await repository.countProducts();

      expect(result).toBe(15);
      expect(getCount).toHaveBeenCalledWith();
    });

    it('should return zero when no products exist', async () => {
      const getCount = jest.fn().mockResolvedValue(0);

      repository.productRepository = {
        count: getCount,
      } as any;

      const result = await repository.countProducts();

      expect(result).toBe(0);
    });
  });

  describe('countOrders', () => {
    it('should return the total number of orders', async () => {
      const getCount = jest.fn().mockResolvedValue(25);

      repository.orderRepository = {
        count: getCount,
      } as any;

      const result = await repository.countOrders();

      expect(result).toBe(25);
      expect(getCount).toHaveBeenCalledWith();
    });

    it('should return zero when no orders exist', async () => {
      const getCount = jest.fn().mockResolvedValue(0);

      repository.orderRepository = {
        count: getCount,
      } as any;

      const result = await repository.countOrders();

      expect(result).toBe(0);
    });
  });

  describe('countSuccessfulPayments', () => {
    it('should count successful payments only', async () => {
      const count = jest.fn().mockResolvedValue(8);

      repository.paymentRepository = {
        count,
      } as any;

      const result = await repository.countSuccessfulPayments();

      expect(result).toBe(8);

      expect(count).toHaveBeenCalledWith({
        where: {
          status: PaymentStatus.SUCCESS,
        },
      });
    });

    it('should return zero when no successful payments exist', async () => {
      const count = jest.fn().mockResolvedValue(0);

      repository.paymentRepository = {
        count,
      } as any;

      const result = await repository.countSuccessfulPayments();

      expect(result).toBe(0);

      expect(count).toHaveBeenCalledWith({
        where: {
          status: PaymentStatus.SUCCESS,
        },
      });
    });
  });

  describe('countPendingPaymentOrders', () => {
    it('should count orders awaiting payment', async () => {
      const count = jest.fn().mockResolvedValue(5);

      repository.orderRepository = {
        count,
      } as any;

      const result = await repository.countPendingPaymentOrders();

      expect(result).toBe(5);

      expect(count).toHaveBeenCalledWith({
        where: {
          status: OrderStatus.PENDING_PAYMENT,
        },
      });
    });

    it('should return zero when no pending payment orders exist', async () => {
      const count = jest.fn().mockResolvedValue(0);

      repository.orderRepository = {
        count,
      } as any;

      const result = await repository.countPendingPaymentOrders();

      expect(result).toBe(0);

      expect(count).toHaveBeenCalledWith({
        where: {
          status: OrderStatus.PENDING_PAYMENT,
        },
      });
    });
  });
  describe('getTotalRevenue', () => {
    it('should return total revenue from paid orders', async () => {
      const getRawOne = jest.fn().mockResolvedValue({
        totalRevenue: '1250000.00',
      });

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne,
      };

      repository.orderRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.getTotalRevenue();

      expect(result).toBe('1250000.00');

      expect(
        repository.orderRepository.createQueryBuilder,
      ).toHaveBeenCalledWith('order');

      expect(queryBuilder.select).toHaveBeenCalledWith(
        'COALESCE(SUM(order.finalPrice), 0)',
        'totalRevenue',
      );

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'order.status = :status',
        {
          status: OrderStatus.PAID,
        },
      );

      expect(getRawOne).toHaveBeenCalled();
    });

    it('should return zero when no paid orders exist', async () => {
      const getRawOne = jest.fn().mockResolvedValue({
        totalRevenue: '0',
      });

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne,
      };

      repository.orderRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.getTotalRevenue();

      expect(result).toBe('0');
    });
  });

  describe('getAdminSales', () => {
    it('should return daily sales grouped by date', async () => {
      const getRawMany = jest.fn().mockResolvedValue([
        {
          period: '2026-08-01T00:00:00.000Z',
          ordersCount: 3,
          revenue: '450000.00',
        },
        {
          period: '2026-08-02T00:00:00.000Z',
          ordersCount: 2,
          revenue: '250000.00',
        },
      ]);

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany,
      };

      repository.orderRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.getAdminSales();

      expect(result).toEqual([
        {
          period: '2026-08-01T00:00:00.000Z',
          ordersCount: '3',
          revenue: '450000.00',
        },
        {
          period: '2026-08-02T00:00:00.000Z',
          ordersCount: '2',
          revenue: '250000.00',
        },
      ]);

      expect(
        repository.orderRepository.createQueryBuilder,
      ).toHaveBeenCalledWith('order');

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'order.status = :status',
        {
          status: OrderStatus.PAID,
        },
      );

      expect(queryBuilder.groupBy).toHaveBeenCalled();

      expect(queryBuilder.orderBy).toHaveBeenCalled();

      expect(getRawMany).toHaveBeenCalled();
    });

    it('should apply date filters when provided', async () => {
      const getRawMany = jest.fn().mockResolvedValue([]);

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany,
      };

      repository.orderRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      await repository.getAdminSales('2026-08-01', '2026-08-31', 'day');

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'order.createdAt >= :from',
        {
          from: '2026-08-01',
        },
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'order.createdAt <= :to',
        {
          to: '2026-08-31',
        },
      );
    });

    it('should support monthly grouping', async () => {
      const getRawMany = jest.fn().mockResolvedValue([
        {
          period: '2026-08-01T00:00:00.000Z',
          ordersCount: 10,
          revenue: '1500000.00',
        },
      ]);

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany,
      };

      repository.orderRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.getAdminSales(
        undefined,
        undefined,
        'month',
      );

      expect(result).toEqual([
        {
          period: '2026-08-01T00:00:00.000Z',
          ordersCount: '10',
          revenue: '1500000.00',
        },
      ]);

      expect(queryBuilder.groupBy).toHaveBeenCalled();
    });

    it('should return an empty array when no paid sales exist', async () => {
      const getRawMany = jest.fn().mockResolvedValue([]);

      const queryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany,
      };

      repository.orderRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.getAdminSales();

      expect(result).toEqual([]);
    });
  });
});
