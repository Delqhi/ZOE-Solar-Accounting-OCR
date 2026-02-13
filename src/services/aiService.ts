/**
 * 🔱 ULTRA 2026 - AI Service Implementation
 * Multi-provider with circuit breaker and cost tracking
 */

import { 
  AIService as UltraAIService,
  AICircuitBreaker,
  GeminiProvider,
  SiliconFlowProvider,
  type Result,
  type AIAnalysis,
  type UserId 
} from '@/lib/ultra';

// ============================================================================
// 🤖 AI SERVICE - Production-ready orchestrator
// ============================================================================

export class AIService extends UltraAIService {
  constructor() {
    super();
  }

  /**
   * Analyze document with automatic fallback and cost tracking
   * 
   * @param imageData - Base64 encoded image
   * @param userId - User identifier
   * @returns Result with AIAnalysis or error
   * 
   * @example
   * ```typescript
   * const result = await aiService.analyzeDocument(base64Image, userId);
   * if (result.success) {
   *   console.log(result.data.totalAmount);
   * } else {
   *   console.error(result.error.message);
   * }
   * ```
   */
  async analyzeDocument(imageData: string, userId: UserId): Promise<Result<AIAnalysis>> {
    return super.analyzeDocument(imageData, userId);
  }

  /**
   * Get cost report for user
   * 
   * @param userId - User identifier (optional)
   * @returns Cost breakdown by provider
   * 
   * @example
   * ```typescript
   * const report = aiService.getCostReport(userId);
   * console.log(`Total: $${report.total.toFixed(2)}`);
   * ```
   */
  getCostReport(userId?: UserId) {
    return super.getCostReport(userId);
  }
}

// ============================================================================
// 🏭 SINGLETON INSTANCE
// ============================================================================

export const aiService = new AIService();

// ============================================================================
// 🎯 CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Quick document analysis without manual service instantiation
 */
export async function analyzeDocument(imageData: string, userId: UserId) {
  return aiService.analyzeDocument(imageData, userId);
}

/**
 * Get current AI costs
 */
export function getAICosts(userId?: UserId) {
  return aiService.getCostReport(userId);
}