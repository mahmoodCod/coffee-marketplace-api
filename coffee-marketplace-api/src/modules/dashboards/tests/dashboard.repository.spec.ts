import { DashboardRepository } from '../repositories/dashboard.repository';
import { OrderStatus } from '../../orders/enums/order-status.enum';

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
    it('should count products whose available inventory is at or below the threshold', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          count: '6',
        }),
      };

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.countLowStockProducts();

      expect(result).toBe(6);

      expect(productRepository.createQueryBuilder).toHaveBeenCalledWith(
        'product',
      );

      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'product.inventory',
        'inventory',
      );

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'inventory.stock - inventory.reservedStock <= :threshold',
        { threshold: 5 },
      );

      expect(queryBuilder.select).toHaveBeenCalledWith(
        'COUNT(product.id)',
        'count',
      );
    });

    it('should return zero when no products have low available inventory', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          count: '0',
        }),
      };

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.countLowStockProducts();

      expect(result).toBe(0);
    });
  });

  describe('countSellerLowStockProducts', () => {
    it('should count only low-stock products owned by the specified seller', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          count: '3',
        }),
      };

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.countSellerLowStockProducts('seller-id');

      expect(result).toBe(3);

      expect(productRepository.createQueryBuilder).toHaveBeenCalledWith(
        'product',
      );

      expect(queryBuilder.innerJoin).toHaveBeenCalledWith(
        'product.inventory',
        'inventory',
      );

      expect(queryBuilder.where).toHaveBeenCalledWith(
        'product.seller_id = :sellerId',
        { sellerId: 'seller-id' },
      );

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'inventory.stock - inventory.reservedStock <= :threshold',
        { threshold: 5 },
      );

      expect(queryBuilder.select).toHaveBeenCalledWith(
        'COUNT(product.id)',
        'count',
      );
    });

    it('should return zero when the seller has no low-stock products', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          count: '0',
        }),
      };

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.countSellerLowStockProducts('seller-id');

      expect(result).toBe(0);
    });

    it('should return zero when the database returns no aggregate result', async () => {
      const queryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue(undefined),
      };

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder);

      const result = await repository.countSellerLowStockProducts('seller-id');

      expect(result).toBe(0);
    });
  });
});
