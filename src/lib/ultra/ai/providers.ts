/**
 * ULTRA 2026 - AI Providers
 * Implementation of AI providers using FREE APIs only
 */

import type { AIAnalysis } from '../types/results';
import type { AIProvider } from './AIService';

// Import the existing free AI service
import { analyzeDocumentFree } from '../../../services/freeAIService';

export class GeminiProvider implements AIProvider {
  name = 'Gemini/NVIDIA';

  async analyze(imageData: string, mimeType: string): Promise<AIAnalysis> {
    const result = await analyzeDocumentFree(imageData, mimeType);
    return {
      documentType: result.documentType || 'unknown',
      vendor: result.vendor || '',
      amount: result.amount || 0,
      confidence: result.confidence || 0.95,
    };
  }
}

export class SiliconFlowProvider implements AIProvider {
  name = 'SiliconFlow';

  async analyze(_imageData: string, _mimeType: string): Promise<AIAnalysis> {
    // This provider is handled by analyzeDocumentFree internally
    throw new Error('SiliconFlow provider handled by freeAIService');
  }
}
