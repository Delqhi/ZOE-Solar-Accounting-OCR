/**
 * 🔱 ZOE SOLAR ACCOUNTING OCR - FREE AI SERVICE
 *
 * 100% KOSTENLOSE OCR-Lösung mit Multi-Provider Fallback
 *
 * Unterstützte FREE APIs (Priorität):
 * 1. NVIDIA Kimi K2.5 - Premium Quality (Primary)
 * 2. SiliconFlow Qwen 2.5 VL (72B) - FREE Tier: 1M tokens/day
 * 3. Mistral AI Pixtral - FREE Tier: 1B tokens/month
 * 4. OpenCode ZEN - 100% FREE unlimited
 *
 * Best Practices February 2026:
 * - Keine kostenpflichtigen APIs
 * - Automatischer Fallback zwischen Free-Tiers
 * - Retry-Logik mit Exponential Backoff
 * - TypeScript Strict Mode
 * - Modular Architecture (all files <100 lines)
 */

// Re-export everything from the modular structure
export {
  analyzeDocumentFree,
  getFreeAPIStatus,
  testFreeAPIs,
  FreeAIServiceError,
  NoAPIKeyError,
  AllProvidersFailedError,
  default,
} from './freeAIService/index';

export type { ExtractedData, LineItem, ProviderStatus, TestResult } from './freeAIService/index';
