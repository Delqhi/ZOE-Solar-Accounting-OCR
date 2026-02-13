import type { ExtractedData, ProviderStatus, TestResult } from './types';
import { FreeAIServiceError, NoAPIKeyError, AllProvidersFailedError } from './errors';
import { FREE_TIER_INFO } from './config';
import { getAvailableProviders, tryProvider } from './providers';

export type { ExtractedData, LineItem, ProviderStatus, TestResult } from './types';
export { FreeAIServiceError, NoAPIKeyError, AllProvidersFailedError } from './errors';

export async function analyzeDocumentFree(
  base64: string,
  mimeType: string
): Promise<Partial<ExtractedData>> {
  const providers = getAvailableProviders();

  if (providers.length === 0) {
    throw new NoAPIKeyError();
  }

  let lastError: FreeAIServiceError | null = null;

  for (const provider of providers) {
    try {
      console.log(`[FreeAI] Versuche OCR mit ${provider.name}...`);
      const result = await tryProvider(provider, base64, mimeType);
      console.log(`[FreeAI] ✅ Erfolg mit ${provider.name}`);
      return result;
    } catch (error) {
      lastError =
        error instanceof FreeAIServiceError
          ? error
          : new FreeAIServiceError(String(error), provider.name, 'API_ERROR', true);

      console.warn(`[FreeAI] ❌ ${provider.name} fehlgeschlagen: ${lastError.message}`);

      if (!lastError.retryable) {
        continue;
      }
    }
  }

  throw new AllProvidersFailedError(lastError ?? undefined);
}

export function getFreeAPIStatus(): ProviderStatus[] {
  const providers = getAvailableProviders();

  return providers.map((provider) => ({
    name: provider.name,
    configured: true,
    freeTier: FREE_TIER_INFO[provider.name] || 'Unknown',
  }));
}

export async function testFreeAPIs(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  const providers = getAvailableProviders();

  for (const provider of providers) {
    try {
      const response = await fetch(provider.config.baseUrl, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      }).catch(() => ({ ok: false }));

      results.push({
        name: provider.name,
        status: response.ok ? 'ok' : 'error',
        message: response.ok ? 'API erreichbar' : 'API nicht erreichbar',
      });
    } catch {
      results.push({
        name: provider.name,
        status: 'error',
        message: 'Verbindungsfehler',
      });
    }
  }

  return results;
}

export default analyzeDocumentFree;
