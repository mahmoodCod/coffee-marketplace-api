import { Test } from '@nestjs/testing';

import { SellerController } from '../controllers/seller.controller';

import { SellerService } from '../services/seller.service';

/**
 * ------------------------------------------------------------------------
 * Seller Controller Unit Tests
 * ------------------------------------------------------------------------
 *
 * Tests the HTTP layer behavior of SellerController.
 *
 * Responsibilities tested:
 *
 * - Controller initialization
 * - Getting seller profile
 * - Updating seller profile
 *
 * Notes:
 *
 * Controller tests should verify:
 * - Correct service method calls
 * - Correct data passing
 * - Correct returned values
 *
 * Business logic is tested inside SellerService tests.
 * ------------------------------------------------------------------------
 */
describe('SellerController', () => {
  let controller: SellerController;

  /**
   * Mock SellerService.
   *
   * The controller depends on SellerService,
   * but we do not want to execute real business logic.
   *
   * Therefore, we replace it with mocked methods.
   */
  const sellerService = {
    getProfile: jest.fn(),

    updateProfile: jest.fn(),
  };

  /**
   * Creates a fresh testing module before each test.
   *
   * This guarantees test isolation
   * and prevents state leaking between tests.
   */
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [SellerController],

      providers: [
        {
          provide: SellerService,

          useValue: sellerService,
        },
      ],
    }).compile();

    controller = module.get<SellerController>(SellerController);

    /**
     * Clear all mock history
     * before running the next test.
     */
    jest.clearAllMocks();
  });

  /**
   * Ensures that the controller
   * is created successfully.
   */
  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /**
   * Mock authenticated seller information.
   *
   * This object simulates the user
   * injected by authentication guards.
   */
  const currentUser = {
    sub: 'seller-id',

    phone: '989121234567',

    role: 'seller',
  };

  /**
   * Mock seller profile response.
   *
   * This represents the data returned
   * from SellerService.
   */
  const profile = {
    id: 'seller-id',

    name: 'Mahmood',

    phone: '989121234567',

    role: 'seller',

    createdAt: new Date(),

    updatedAt: new Date(),
  };

  /**
   * ----------------------------------------------------------------------
   * getProfile
   * ----------------------------------------------------------------------
   *
   * Verifies that:
   *
   * - Controller calls SellerService.getProfile()
   * - Authenticated user data is passed correctly
   * - Returned profile is returned to the client
   *
   */
  describe('getProfile', () => {
    it('should return seller profile', async () => {
      sellerService.getProfile.mockResolvedValue(profile);

      const result = await controller.getProfile(currentUser as any);

      expect(sellerService.getProfile).toHaveBeenCalledWith(currentUser);

      expect(result).toEqual(profile);
    });
  });

  /**
   * ----------------------------------------------------------------------
   * updateProfile
   * ----------------------------------------------------------------------
   *
   * Verifies that:
   *
   * - Controller sends update data to SellerService
   * - Updated seller profile is returned correctly
   *
   */
  describe('updateProfile', () => {
    it('should update seller profile', async () => {
      sellerService.updateProfile.mockResolvedValue({
        ...profile,

        name: 'New Seller',
      });

      const dto = {
        name: 'New Seller',
      };

      const result = await controller.updateProfile(
        currentUser as any,

        dto,
      );

      expect(sellerService.updateProfile).toHaveBeenCalledWith(
        currentUser,

        dto,
      );

      expect(result.name).toBe('New Seller');
    });
  });
});
