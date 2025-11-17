import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categorizeError, handleError, ERROR_MESSAGES } from '../error-handler';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear console mocks
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('categorizeError', () => {
    it('should categorize network errors correctly', () => {
      const networkErrors = [
        new Error('Failed to fetch'),
        new Error('network error occurred'),
        new Error('NetworkError: Connection failed'),
      ];

      networkErrors.forEach(error => {
        const result = categorizeError(error);
        expect(result.type).toBe('network');
        expect(result.isRetryable).toBe(true);
        expect(result.message).toBe('Network connection failed');
      });
    });

    it('should categorize timeout errors correctly', () => {
      const timeoutErrors = [
        new Error('Request timeout'),
        new Error('Connection timed out'),
        new Error('ETIMEDOUT'),
      ];

      timeoutErrors.forEach(error => {
        const result = categorizeError(error);
        expect(result.type).toBe('timeout');
        expect(result.isRetryable).toBe(true);
        expect(result.message).toBe('Request timed out');
      });
    });

    it('should categorize server errors (5xx) correctly', () => {
      const serverErrors = [
        new Error('HTTP 500 Internal Server Error'),
        new Error('502 Bad Gateway'),
        new Error('503 Service Unavailable'),
        new Error('504 Gateway Timeout'),
      ];

      serverErrors.forEach(error => {
        const result = categorizeError(error);
        expect(result.type).toBe('server');
        expect(result.isRetryable).toBe(true);
        expect(result.message).toBe('Server error occurred');
      });
    });

    it('should categorize client errors (4xx) correctly', () => {
      const clientErrors = [
        new Error('400 Bad Request'),
        new Error('401 Unauthorized'),
        new Error('403 Forbidden'),
        new Error('404 Not Found'),
      ];

      clientErrors.forEach(error => {
        const result = categorizeError(error);
        expect(result.type).toBe('client');
        expect(result.isRetryable).toBe(false);
        expect(result.message).toBe('Invalid request');
      });
    });

    it('should categorize unknown errors correctly', () => {
      const unknownErrors = [
        new Error('Something went wrong'),
        new Error('Unexpected error'),
        'String error',
      ];

      unknownErrors.forEach(error => {
        const result = categorizeError(error);
        expect(result.type).toBe('unknown');
        expect(result.isRetryable).toBe(true);
      });
    });

    it('should handle non-Error objects', () => {
      const result = categorizeError('Plain string error');
      expect(result.type).toBe('unknown');
      expect(result.message).toBe('Plain string error');
      expect(result.isRetryable).toBe(true);
    });
  });

  describe('handleError', () => {
    it('should log error and show toast notification', () => {
      const error = new Error('Test error');
      const config = ERROR_MESSAGES.PRICE_FETCH;

      handleError(error, config);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Price service error'),
        error
      );
      expect(toast.error).toHaveBeenCalledWith(
        'Price fetch failed',
        expect.objectContaining({
          description: 'Unable to fetch live market data. Retrying...',
        })
      );
    });

    it('should handle errors without logPrefix', () => {
      const error = new Error('Test error');
      const config = {
        title: 'Test Error',
        description: 'Test description',
      };

      handleError(error, config);

      expect(console.error).toHaveBeenCalledWith('Test error', error);
      expect(toast.error).toHaveBeenCalledWith(
        'Test Error',
        expect.objectContaining({
          description: 'Test description',
        })
      );
    });

    it('should handle non-Error objects', () => {
      const error = 'String error';
      const config = ERROR_MESSAGES.NETWORK_ERROR;

      handleError(error, config);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('String error'),
        error
      );
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should have all required error message configurations', () => {
      const requiredMessages = [
        'MODAL_OPEN',
        'NAVIGATION',
        'PREVIEW_OPEN',
        'MODAL_CLOSE',
        'IFRAME_LOAD',
        'CHART_LOAD',
        'CHART_SCRIPT',
        'PRICE_FETCH',
        'NETWORK_ERROR',
        'API_TIMEOUT',
        'API_UNAVAILABLE',
      ];

      requiredMessages.forEach(key => {
        expect(ERROR_MESSAGES[key as keyof typeof ERROR_MESSAGES]).toBeDefined();
        expect(ERROR_MESSAGES[key as keyof typeof ERROR_MESSAGES].title).toBeTruthy();
        expect(ERROR_MESSAGES[key as keyof typeof ERROR_MESSAGES].description).toBeTruthy();
      });
    });

    it('should have consistent structure for all error messages', () => {
      Object.values(ERROR_MESSAGES).forEach(config => {
        expect(config).toHaveProperty('title');
        expect(config).toHaveProperty('description');
        expect(config).toHaveProperty('logPrefix');
        expect(typeof config.title).toBe('string');
        expect(typeof config.description).toBe('string');
      });
    });
  });
});
