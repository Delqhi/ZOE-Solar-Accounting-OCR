/**
 * Gemini Service - DEPRECATED
 *
 * Diese Datei ist veraltet und wird nur für Abwärtskompatibilität beibehalten.
 * Bitte verwenden Sie stattdessen: import { analyzeDocumentFree } from './freeAIService'
 *
 * Die neue Implementierung nutzt 100% FREE APIs:
 * - NVIDIA API (Kimi K2.5) - Primary
 * - SiliconFlow Qwen 2.5 VL - Fallback
 * - Mistral AI - Fallback
 * - OpenCode ZEN - Fallback
 */

import { analyzeDocumentFree, FreeAIServiceError } from './freeAIService';
import type { ExtractedData } from '../types';

export { FreeAIServiceError };

/**
 * @deprecated Verwenden Sie analyzeDocumentFree() stattdessen
 * Diese Funktion ruft jetzt intern analyzeDocumentFree() auf
 */
export async function analyzeDocumentWithGemini(
  base64: string,
  mimeType: string
): Promise<Partial<ExtractedData>> {
  console.warn(
    '[DEPRECATED] analyzeDocumentWithGemini() ist veraltet. Verwenden Sie analyzeDocumentFree() für NVIDIA API + Kimi K2.5'
  );

  try {
    return await analyzeDocumentFree(base64, mimeType);
  } catch (error) {
    if (error instanceof FreeAIServiceError) {
      console.error(`[GeminiService] OCR Fehler: ${error.message}`);
    }
    throw error;
  }
}
