import { Repository } from 'typeorm';

import { ReviewRepository } from '../repositories/review.repository';

import { Review } from '../entities/review.entity';

describe('ReviewRepository', () => {
  let reviewRepository: ReviewRepository;

  /**
   * Mocked TypeORM repository.
   *
   * Only methods used by ReviewRepository
   * are mocked.
   */
  let repository: {
    findOne: jest.Mock;
    find: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    reviewRepository = new ReviewRepository(
      repository as unknown as Repository<Review>,
    );
  });

  describe('findById', () => {
    it('should find a review by ID', async () => {
      const review = {
        id: 'review-id',
      } as Review;

      repository.findOne.mockResolvedValue(review);

      const result = await reviewRepository.findById('review-id');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'review-id',
        },
        relations: {
          user: true,
          product: true,
        },
      });

      expect(result).toEqual(review);
    });

    it('should return null when review does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await reviewRepository.findById('review-id');

      expect(result).toBeNull();
    });
  });

  describe('findByIdAndUserId', () => {
    it('should find a review by review ID and user ID', async () => {
      const review = {
        id: 'review-id',
      } as Review;

      repository.findOne.mockResolvedValue(review);

      const result = await reviewRepository.findByIdAndUserId(
        'review-id',
        'user-id',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: 'review-id',
          user: {
            id: 'user-id',
          },
        },
        relations: {
          user: true,
          product: true,
        },
      });

      expect(result).toEqual(review);
    });
  });

  describe('findByUserIdAndProductId', () => {
    it('should find a review by user and product', async () => {
      const review = {
        id: 'review-id',
      } as Review;

      repository.findOne.mockResolvedValue(review);

      const result = await reviewRepository.findByUserIdAndProductId(
        'user-id',
        'product-id',
      );

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          user: {
            id: 'user-id',
          },
          product: {
            id: 'product-id',
          },
        },
        relations: {
          user: true,
          product: true,
        },
      });

      expect(result).toEqual(review);
    });

    it('should return null when the user has not reviewed the product', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await reviewRepository.findByUserIdAndProductId(
        'user-id',
        'product-id',
      );

      expect(result).toBeNull();
    });
  });

  describe('findApprovedByProductId', () => {
    it('should return only approved reviews for a product', async () => {
      const reviews = [
        {
          id: 'review-1',
          isApproved: true,
        },
      ] as Review[];

      repository.find.mockResolvedValue(reviews);

      const result =
        await reviewRepository.findApprovedByProductId('product-id');

      expect(repository.find).toHaveBeenCalledWith({
        where: {
          product: {
            id: 'product-id',
          },
          isApproved: true,
        },
        relations: {
          user: true,
          product: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      expect(result).toEqual(reviews);
    });

    it('should return an empty array when no approved reviews exist', async () => {
      repository.find.mockResolvedValue([]);

      const result =
        await reviewRepository.findApprovedByProductId('product-id');

      expect(result).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all reviews ordered by creation date', async () => {
      const reviews = [
        {
          id: 'review-1',
        },
        {
          id: 'review-2',
        },
      ] as Review[];

      repository.find.mockResolvedValue(reviews);

      const result = await reviewRepository.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: {
          user: true,
          product: true,
        },
        order: {
          createdAt: 'DESC',
        },
      });

      expect(result).toEqual(reviews);
    });
  });

  describe('create', () => {
    it('should create a review entity', () => {
      const review = {
        id: 'review-id',
      } as Review;

      const data = {
        rating: 5,
        comment: 'Excellent coffee.',
      };

      repository.create.mockReturnValue(review);

      const result = reviewRepository.create(data);

      expect(repository.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(review);
    });
  });

  describe('save', () => {
    it('should save a review', async () => {
      const review = {
        id: 'review-id',
      } as Review;

      repository.save.mockResolvedValue(review);

      const result = await reviewRepository.save(review);

      expect(repository.save).toHaveBeenCalledWith(review);
      expect(result).toEqual(review);
    });
  });

  describe('remove', () => {
    it('should remove a review', async () => {
      const review = {
        id: 'review-id',
      } as Review;

      repository.remove.mockResolvedValue(review);

      const result = await reviewRepository.remove(review);

      expect(repository.remove).toHaveBeenCalledWith(review);
      expect(result).toEqual(review);
    });
  });
});
