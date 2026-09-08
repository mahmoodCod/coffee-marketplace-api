import { DashboardRepository } from '../repositories/dashboard.repository';
import { OrderStatus } from '../../orders/enums/order-status.enum';
import { ProductStatus } from 'src/modules/products/enums';

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
      const getCount = jest.fn().mockResolvedValue(6);

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount,
      };

      repository.productRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const sellerId = 'seller-id';

      const result = await repository.countSellerProducts(sellerId);

      expect(result).toBe(6);

      expect(
        repository.productRepository.createQueryBuilder,
      ).toHaveBeenCalledWith('product');

      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'product.seller',
        'seller',
      );

      expect(queryBuilder.where).toHaveBeenCalledWith('seller.id = :sellerId', {
        sellerId,
      });

      expect(getCount).toHaveBeenCalled();
    });

    it('should return zero when the seller has no products', async () => {
      const getCount = jest.fn().mockResolvedValue(0);

      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount,
      };

      repository.productRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.countSellerProducts('seller-id');

      expect(result).toBe(0);
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
      const getCount = jest.fn().mockResolvedValue(8);

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount,
      };

      repository.paymentRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.countSuccessfulPayments();

      expect(result).toBe(8);

      expect(
        repository.paymentRepository.createQueryBuilder,
      ).toHaveBeenCalledWith('payment');

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'payment.status = :status',
        {
          status: PaymentStatus.SUCCESS,
        },
      );

      expect(getCount).toHaveBeenCalled();
    });

    it('should return zero when no successful payments exist', async () => {
      const getCount = jest.fn().mockResolvedValue(0);

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        getCount,
      };

      repository.paymentRepository = {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as any;

      const result = await repository.countSuccessfulPayments();

      expect(result).toBe(0);
    });
  });
});
