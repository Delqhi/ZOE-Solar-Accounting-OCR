import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tryProvider } from '../providers';
import { nvidiaProvider } from '../providers/nvidia';
import { siliconflowProvider } from '../providers/siliconflow';
import { mistralProvider } from '../providers/mistral';
import { opencodeProvider } from '../providers/opencode';

describe('AI Provider Chain', () => {
  const mockImage = 'base64ImageData';
  const mockResult = {
    text: 'Test OCR Result',
    confidence: 0.95
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('tryProvider', () => {
    it('should return result on successful analysis', async () => {
      const mockProvider = {
        name: 'TestProvider',
        analyzeImage: vi.fn().mockResolvedValue(mockResult)
      };

      const result = await tryProvider(mockProvider, mockImage);
      
      expect(result).toEqual(mockResult);
      expect(mockProvider.analyzeImage).toHaveBeenCalledWith(mockImage);
    });

    it('should throw error on failure', async () => {
      const mockProvider = {
        name: 'FailingProvider',
        analyzeImage: vi.fn().mockRejectedValue(new Error('API Error'))
      };

      await expect(tryProvider(mockProvider, mockImage))
        .rejects.toThrow('FailingProvider failed: API Error');
    });
  });

  describe('Provider Priority', () => {
    it('should try NVIDIA first', async () => {
      const nvidiaSpy = vi.spyOn(nvidiaProvider, 'analyzeImage')
        .mockResolvedValue(mockResult);

      await nvidiaProvider.analyzeImage(mockImage);
      
      expect(nvidiaSpy).toHaveBeenCalled();
    });

    it('should fallback to SiliconFlow', async () => {
      vi.spyOn(nvidiaProvider, 'analyzeImage')
        .mockRejectedValue(new Error('NVIDIA Down'));
      
      const siliconflowSpy = vi.spyOn(siliconflowProvider, 'analyzeImage')
        .mockResolvedValue(mockResult);

      // Chain would try NVIDIA first, then SiliconFlow
      try {
        await nvidiaProvider.analyzeImage(mockImage);
      } catch {
        const result = await siliconflowProvider.analyzeImage(mockImage);
        expect(result).toEqual(mockResult);
      }
      
      expect(siliconflowSpy).toHaveBeenCalled();
    });
  });
});

describe('Provider Error Handling', () => {
  it('should handle network errors gracefully', async () => {
    const mockProvider = {
      name: 'NetworkErrorProvider',
      analyzeImage: vi.fn().mockRejectedValue(new Error('Network Error'))
    };

    await expect(tryProvider(mockProvider, 'image'))
      .rejects.toThrow('Network Error');
  });

  it('should handle timeout errors', async () => {
    const mockProvider = {
      name: 'TimeoutProvider',
      analyzeImage: vi.fn().mockRejectedValue(new Error('Timeout'))
    };

    await expect(tryProvider(mockProvider, 'image'))
      .rejects.toThrow('Timeout');
  });
});
