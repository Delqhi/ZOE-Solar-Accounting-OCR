import { describe, it, expect } from 'vitest';
import {
  FreeAIServiceError,
  NoAPIKeyError,
  AllProvidersFailedError,
  ProviderError,
  ErrorCode
} from '../errors';

describe('Error Classes', () => {
  describe('FreeAIServiceError', () => {
    it('should create base error', () => {
      const error = new FreeAIServiceError(
        'Test message',
        ErrorCode.PROVIDER_ERROR
      );
      
      expect(error.message).toBe('Test message');
      expect(error.code).toBe(ErrorCode.PROVIDER_ERROR);
      expect(error.name).toBe('FreeAIServiceError');
    });

    it('should be instance of Error', () => {
      const error = new FreeAIServiceError('Test', ErrorCode.PROVIDER_ERROR);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('NoAPIKeyError', () => {
    it('should create with provider name', () => {
      const error = new NoAPIKeyError('NVIDIA');
      
      expect(error.message).toContain('NVIDIA');
      expect(error.code).toBe(ErrorCode.NO_API_KEY);
      expect(error.provider).toBe('NVIDIA');
    });

    it('should create without provider name', () => {
      const error = new NoAPIKeyError();
      
      expect(error.message).toContain('No API key');
      expect(error.provider).toBeUndefined();
    });
  });

  describe('AllProvidersFailedError', () => {
    it('should create with errors array', () => {
      const errors = [
        new Error('NVIDIA failed'),
        new Error('Mistral failed')
      ];
      
      const error = new AllProvidersFailedError(errors);
      
      expect(error.message).toContain('All providers failed');
      expect(error.errors).toEqual(errors);
      expect(error.code).toBe(ErrorCode.ALL_PROVIDERS_FAILED);
    });

    it('should create with empty errors', () => {
      const error = new AllProvidersFailedError([]);
      
      expect(error.errors).toEqual([]);
    });
  });

  describe('ProviderError', () => {
    it('should create with provider name', () => {
      const originalError = new Error('Timeout');
      const error = new ProviderError('NVIDIA', originalError);
      
      expect(error.message).toBe('NVIDIA failed: Timeout');
      expect(error.provider).toBe('NVIDIA');
      expect(error.originalError).toBe(originalError);
      expect(error.code).toBe(ErrorCode.PROVIDER_ERROR);
    });
  });
});
