import { ServiceUnavailableException } from '@nestjs/common';
import type OpenAI from 'openai';

import { Product } from 'src/modules/products/entities/product.entity';
import { ProductService } from 'src/modules/products/services/product.service';
import { SupportChatService } from '../services/support-chat.service';
import { beforeEach, describe } from 'node:test';

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
  });
});
function expect(findAllForSupportChat: any) {
    throw new Error('Function not implemented.');
}

