
import { ServiceUnavailableException } from '@nestjs/common';
import type OpenAI from 'openai';

import { Product } from 'src/modules/products/entities/product.entity';
import { ProductService } from 'src/modules/products/services/product.service';
import { SupportChatService } from '../services/support-chat.service';

describe('SupportChatService', () => {
  let service: SupportChatService;

  const productServiceMock = {
    findAllForSupportChat: jest.fn(),
    searchForSupportChat: jest.fn(),
  };

  let aiCreateSpy: jest.SpyInstance;

  const mockAiResponse = (content: string) =>
    ({
      choices: [
        {
          message: {
            content,
          },
        },
      ],
    }) as never;

  beforeEach(() => {
    jest.clearAllMocks();

    service = new SupportChatService(
      productServiceMock as unknown as ProductService,
    );

    // Access the private AI client only for unit testing.
    const aiClient = (service as unknown as { ai: OpenAI }).ai;

    aiCreateSpy = jest.spyOn(aiClient.chat.completions, 'create');

    aiCreateSpy.mockResolvedValue(mockAiResponse('پاسخ آزمایشی چت‌بات'));
  });

  describe('sendMessage', () => {
    it('should retrieve all products for a general catalog question', async () => {
      productServiceMock.findAllForSupportChat.mockResolvedValue([]);

      const result = await service.sendMessage('چه محصولاتی در فروشگاه هست؟');

      expect(productServiceMock.findAllForSupportChat).toHaveBeenCalledTimes(1);
      expect(productServiceMock.searchForSupportChat).not.toHaveBeenCalled();

      expect(result.reply).toContain('هنوز محصولی');
      expect(aiCreateSpy).not.toHaveBeenCalled();
    });

    it('should recognize a casual request to list all products', async () => {
      productServiceMock.findAllForSupportChat.mockResolvedValue([]);

      await service.sendMessage('لیست خودت بهم بده');

      expect(productServiceMock.findAllForSupportChat).toHaveBeenCalledTimes(1);
      expect(productServiceMock.searchForSupportChat).not.toHaveBeenCalled();
    });

    it('should recognize casual Persian catalog questions without ASCII word boundaries', async () => {
      productServiceMock.findAllForSupportChat.mockResolvedValue([]);

      await service.sendMessage('توی فروشگاه من چیه');

      expect(productServiceMock.findAllForSupportChat).toHaveBeenCalledTimes(1);
      expect(productServiceMock.searchForSupportChat).not.toHaveBeenCalled();
    });

    it('should recognize short what-do-you-have catalog questions', async () => {
      productServiceMock.findAllForSupportChat.mockResolvedValue([]);

      await service.sendMessage('چی دارید');

      expect(productServiceMock.findAllForSupportChat).toHaveBeenCalledTimes(1);
      expect(productServiceMock.searchForSupportChat).not.toHaveBeenCalled();
    });

    it('should search for products when the customer asks a specific question', async () => {
      productServiceMock.searchForSupportChat.mockResolvedValue([]);

      const result = await service.sendMessage('آیا قهوه عربیکا دارید؟');

      expect(productServiceMock.searchForSupportChat).toHaveBeenCalledWith(
        'آیا قهوه عربیکا دارید؟',
      );

      expect(productServiceMock.findAllForSupportChat).not.toHaveBeenCalled();
      expect(result.reply).toBe('پاسخ آزمایشی چت‌بات');
    });

    it('should include out-of-stock products in the AI context', async () => {
      const outOfStockProduct = {
        title: 'قهوه عربیکا',
        description: 'قهوه عربیکا با طعم ملایم',
        price: '250000',
        originalPrice: null,
        productType: 'coffee',
        weight: 250,
        caffeineLevel: 'medium',
        flavorNotes: ['شکلاتی'],
        originCountry: 'Brazil',
        ingredients: [],
        benefits: [],
        howToUse: 'دم‌آوری با دستگاه',
        inventory: {
          stock: 0,
          reservedStock: 0,
        },
      } as unknown as Product;

      productServiceMock.findAllForSupportChat.mockResolvedValue([
        outOfStockProduct,
      ]);

      await service.sendMessage('چه محصولاتی در فروشگاه هست؟');

      expect(aiCreateSpy).toHaveBeenCalledTimes(1);

      const aiRequest = aiCreateSpy.mock.calls[0][0];

      const userMessage = aiRequest.messages.find(
        (message) => message.role === 'user',
      );

      expect(userMessage?.content).toContain('قهوه عربیکا');
      expect(userMessage?.content).toContain('"availableStock": 0');
      expect(userMessage?.content).toContain('"availability": "ناموجود"');
    });

    it('should mark products with positive available stock as available', async () => {
      const availableProduct = {
        title: 'قهوه روبوستا',
        description: 'قهوه روبوستا با کافئین بالا',
        price: '180000',
        originalPrice: '200000',
        productType: 'coffee',
        weight: 500,
        caffeineLevel: 'high',
        flavorNotes: ['تلخ'],
        originCountry: 'Vietnam',
        ingredients: [],
        benefits: [],
        howToUse: 'اسپرسو',
        inventory: {
          stock: 12,
          reservedStock: 2,
        },
      } as unknown as Product;

      productServiceMock.findAllForSupportChat.mockResolvedValue([
        availableProduct,
      ]);

      await service.sendMessage('چه محصولاتی در فروشگاه هست؟');

      const aiRequest = aiCreateSpy.mock.calls[0][0];
      const userMessage = aiRequest.messages.find(
        (message) => message.role === 'user',
      );

      expect(userMessage?.content).toContain('قهوه روبوستا');
      expect(userMessage?.content).toContain('"price": 180000');
      expect(userMessage?.content).toContain('"originalPrice": 200000');
      expect(userMessage?.content).toContain('"stock": 12');
      expect(userMessage?.content).toContain('"reservedStock": 2');
      expect(userMessage?.content).toContain('"availableStock": 10');
      expect(userMessage?.content).toContain('"availability": "موجود"');
    });

    it('should treat missing inventory as unknown availability', async () => {
      const productWithoutInventory = {
        title: 'قهوه ترک',
        description: 'قهوه ترک سنتی',
        price: '150000',
        originalPrice: null,
        productType: 'coffee',
        weight: 250,
        caffeineLevel: 'medium',
        flavorNotes: [],
        originCountry: 'Turkey',
        ingredients: [],
        benefits: [],
        howToUse: 'جوشاندن در قهوه جوش',
        inventory: undefined,
      } as unknown as Product;

      productServiceMock.searchForSupportChat.mockResolvedValue([
        productWithoutInventory,
      ]);

      await service.sendMessage('آیا قهوه ترک دارید؟');

      const aiRequest = aiCreateSpy.mock.calls[0][0];
      const userMessage = aiRequest.messages.find(
        (message) => message.role === 'user',
      );

      expect(userMessage?.content).toContain('قهوه ترک');
      expect(userMessage?.content).toContain('"stock": null');
      expect(userMessage?.content).toContain('"reservedStock": null');
      expect(userMessage?.content).toContain('"availableStock": null');
      expect(userMessage?.content).toContain(
        '"availability": "وضعیت موجودی نامشخص است"',
      );
    });

    it('should tell the AI that no matching products were found for specific searches', async () => {
      productServiceMock.searchForSupportChat.mockResolvedValue([]);

      await service.sendMessage('آیا قهوه اتیوپی دارید؟');

      const aiRequest = aiCreateSpy.mock.calls[0][0];
      const userMessage = aiRequest.messages.find(
        (message) => message.role === 'user',
      );

      expect(userMessage?.content).toContain(
        'No matching products were found in the catalog.',
      );
    });

    it('should instruct the AI to list provided out-of-stock products in the catalog', async () => {
      const outOfStockProduct = {
        title: 'قهوه عربیکا',
        description: 'قهوه عربیکا با طعم ملایم',
        price: '250000',
        originalPrice: null,
        productType: 'coffee',
        weight: 250,
        caffeineLevel: 'medium',
        flavorNotes: ['شکلاتی'],
        originCountry: 'Brazil',
        ingredients: [],
        benefits: [],
        howToUse: 'دم‌آوری با دستگاه',
        inventory: {
          stock: 0,
          reservedStock: 0,
        },
      } as unknown as Product;

      productServiceMock.findAllForSupportChat.mockResolvedValue([
        outOfStockProduct,
      ]);

      await service.sendMessage('چه محصولاتی در فروشگاه هست؟');

      const aiRequest = aiCreateSpy.mock.calls[0][0];
      const systemMessage = aiRequest.messages.find(
        (message) => message.role === 'system',
      );

      expect(systemMessage?.content).toContain(
        'including products whose available stock is zero',
      );
      expect(systemMessage?.content).toContain(
        'Available stock of zero means it is temporarily out of stock',
      );
      expect(systemMessage?.content).toContain(
        'Never invent or estimate stock quantities.',
      );
    });

    it('should return a service unavailable error when AI returns an empty response', async () => {
      productServiceMock.searchForSupportChat.mockResolvedValue([]);

      aiCreateSpy.mockResolvedValue(mockAiResponse('   '));

      await expect(service.sendMessage('سلام')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('should handle local AI connection errors', async () => {
      productServiceMock.searchForSupportChat.mockResolvedValue([]);

      aiCreateSpy.mockRejectedValue(new Error('LM Studio connection refused'));

      await expect(service.sendMessage('سلام')).rejects.toThrow(
        'The support chatbot is temporarily unavailable. Please try again later.',
      );
    });

    it('should wrap unexpected non-error failures as service unavailable', async () => {
      productServiceMock.searchForSupportChat.mockResolvedValue([]);

      aiCreateSpy.mockRejectedValue('unexpected failure');

      await expect(service.sendMessage('سلام')).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});
