import { RedisService } from 'src/redis';

import {
  SUPPORT_CHAT_HISTORY_KEY_PREFIX,
  SUPPORT_CHAT_HISTORY_MAX_MESSAGES,
  SUPPORT_CHAT_HISTORY_TTL_SECONDS,
} from '../constants/support-chat-history.constants';
import { SupportChatHistoryService } from '../services/support-chat-history.service';

describe('SupportChatHistoryService', () => {
  let service: SupportChatHistoryService;

  const redisServiceMock = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new SupportChatHistoryService(
      redisServiceMock as unknown as RedisService,
    );
  });

  describe('getHistory', () => {
    it('should return an empty list when Redis has no session history', async () => {
      redisServiceMock.get.mockResolvedValue(null);

      await expect(service.getHistory('session-1')).resolves.toEqual([]);
    });

    it('should return parsed conversation messages from Redis', async () => {
      redisServiceMock.get.mockResolvedValue(
        JSON.stringify([
          { role: 'user', content: 'سلام' },
          { role: 'assistant', content: 'سلام، چطور کمک کنم؟' },
        ]),
      );

      await expect(service.getHistory('session-1')).resolves.toEqual([
        { role: 'user', content: 'سلام' },
        { role: 'assistant', content: 'سلام، چطور کمک کنم؟' },
      ]);

      expect(redisServiceMock.get).toHaveBeenCalledWith(
        `${SUPPORT_CHAT_HISTORY_KEY_PREFIX}session-1`,
      );
    });

    it('should return an empty list when Redis fails', async () => {
      redisServiceMock.get.mockRejectedValue(new Error('Redis unavailable'));

      await expect(service.getHistory('session-1')).resolves.toEqual([]);
    });
  });

  describe('appendTurn', () => {
    it('should append the new turn and refresh Redis expiration', async () => {
      redisServiceMock.get.mockResolvedValue(
        JSON.stringify([{ role: 'user', content: 'سلام' }]),
      );
      redisServiceMock.set.mockResolvedValue(undefined);

      await service.appendTurn('session-1', 'چی دارید؟', 'قهوه عربیکا');

      expect(redisServiceMock.set).toHaveBeenCalledWith(
        `${SUPPORT_CHAT_HISTORY_KEY_PREFIX}session-1`,
        JSON.stringify([
          { role: 'user', content: 'سلام' },
          { role: 'user', content: 'چی دارید؟' },
          { role: 'assistant', content: 'قهوه عربیکا' },
        ]),
        SUPPORT_CHAT_HISTORY_TTL_SECONDS,
      );
    });

    it('should keep only the newest messages when history exceeds the limit', async () => {
      const existingHistory = Array.from(
        { length: SUPPORT_CHAT_HISTORY_MAX_MESSAGES },
        (_, index) => ({
          role: index % 2 === 0 ? 'user' : 'assistant',
          content: `message-${index}`,
        }),
      );

      redisServiceMock.get.mockResolvedValue(JSON.stringify(existingHistory));
      redisServiceMock.set.mockResolvedValue(undefined);

      await service.appendTurn('session-1', 'سؤال جدید', 'پاسخ جدید');

      const savedHistory = JSON.parse(
        redisServiceMock.set.mock.calls[0][1],
      ) as Array<{ content: string }>;

      expect(savedHistory).toHaveLength(SUPPORT_CHAT_HISTORY_MAX_MESSAGES);
      expect(savedHistory.at(-2)?.content).toBe('سؤال جدید');
      expect(savedHistory.at(-1)?.content).toBe('پاسخ جدید');
    });

    it('should ignore Redis write failures', async () => {
      redisServiceMock.get.mockResolvedValue(null);
      redisServiceMock.set.mockRejectedValue(new Error('Redis write failed'));

      await expect(
        service.appendTurn('session-1', 'سلام', 'سلام'),
      ).resolves.toBeUndefined();
    });
  });
});
